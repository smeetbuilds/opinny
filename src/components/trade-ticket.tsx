"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, Info, LoaderCircle, PauseCircle, ShieldCheck, Trophy, X } from "lucide-react";
import type { Market, OrderIntent, OrderPreview } from "@/core/contracts/domain";
import { formatCurrency, formatDate } from "@/lib/format";
import { appConfig } from "@/lib/config";
import { dataAdapter } from "@/lib/data";
import { captureException } from "@/lib/observability";
import { useApp } from "./app-provider";

type TradeEvent = CustomEvent<{ outcomeId: string }>;
const cleanNumber = (value: string) => value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
const stateCopy: Record<Market["status"], { title: string; description: string }> = {
  open: { title: "Trading open", description: "Orders can be prepared through the connected integration." },
  paused: { title: "Trading paused", description: "New orders are unavailable while this market is under review or maintenance." },
  resolved: { title: "Market resolved", description: "Trading is closed. Review the final outcome and resolution source." },
  draft: { title: "Market unavailable", description: "This market is not published for trading." }
};
const maintenanceCopy = { title: "Trading paused", description: "Order entry is temporarily disabled by the interface policy." };

export function TradeTicket({ market }: { market: Market }) {
  const {
    connected,
    setWalletOpen,
    notify,
    executeWalletRequest,
    balances,
    preferences,
    preferencesHydrated,
    tradingEnabled
  } = useApp();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit">(preferences.orderType);
  const [outcome, setOutcome] = useState(market.outcomes[0].id);
  const [amount, setAmount] = useState("100");
  const [limitPrice, setLimitPrice] = useState(String(market.outcomes[0].probability));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [preview, setPreview] = useState<OrderPreview | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const previewGeneration = useRef(0);
  const orderTypeTouched = useRef(false);
  const marketOpen = market.status === "open";
  const tradingOpen = marketOpen && tradingEnabled;

  const selected = market.outcomes.find((item) => item.id === outcome) ?? market.outcomes[0];
  const price = orderType === "limit" ? (Number(limitPrice) || 0) / 100 : selected.probability / 100;
  const amountNumber = Number(amount) || 0;
  const invalidPrice = orderType === "limit" && (Number(limitPrice) <= 0 || Number(limitPrice) > 100);
  const inputError = !marketOpen
    ? stateCopy[market.status].description
    : !tradingEnabled
      ? maintenanceCopy.description
      : amountNumber <= 0
        ? `Enter ${side === "buy" ? "an amount" : "a share quantity"} greater than zero.`
        : invalidPrice
          ? "Limit price must be between 1¢ and 100¢."
          : "";
  const error = inputError || submitError || previewError;
  const canSubmit = tradingOpen && !inputError && price > 0 && !busy && !previewBusy && Boolean(preview);
  const availableBalance = balances.find((balance) => balance.asset === appConfig.collateral)?.available;
  const maxSlippageBps = Math.round(Number(preferences.slippageWarning) * 100);

  useEffect(() => {
    if (!preferencesHydrated || orderTypeTouched.current) return;
    setOrderType(preferences.orderType);
  }, [preferences.orderType, preferencesHydrated]);

  useEffect(() => {
    const requestedOutcome = new URLSearchParams(window.location.search).get("outcome");
    const next = market.outcomes.find((item) => item.id === requestedOutcome);
    if (next) {
      setOutcome(next.id);
      setLimitPrice(String(next.probability));
    }
  }, [market.outcomes]);

  useEffect(() => {
    const openForOutcome = (event: Event) => {
      const { outcomeId } = (event as TradeEvent).detail;
      const next = market.outcomes.find((item) => item.id === outcomeId);
      if (!next) return;
      setOutcome(next.id);
      setLimitPrice(String(next.probability));
      setSubmitError("");
      if (window.matchMedia("(max-width: 980px)").matches) setMobileOpen(true);
      else document.getElementById("trade-ticket")?.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    window.addEventListener("opinny:trade", openForOutcome);
    return () => window.removeEventListener("opinny:trade", openForOutcome);
  }, [market.outcomes]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    const close = (event: KeyboardEvent) => event.key === "Escape" && !busy && setMobileOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", close);
    };
  }, [busy, mobileOpen]);

  useEffect(() => {
    const generation = ++previewGeneration.current;
    setPreview(null);
    setPreviewError("");
    if (inputError || !tradingOpen || price <= 0) {
      setPreviewBusy(false);
      return;
    }

    setPreviewBusy(true);
    const timer = window.setTimeout(async () => {
      const intent: OrderIntent = {
        clientRequestId: `preview-${market.id}`,
        marketId: market.id,
        outcomeId: selected.id,
        side,
        type: orderType,
        collateralAmount: side === "buy" ? amountNumber : undefined,
        shares: side === "sell" ? amountNumber : undefined,
        limitPrice: orderType === "limit" ? price : undefined,
        maxSlippageBps
      };
      try {
        const next = await dataAdapter.previewOrder(intent);
        if (generation !== previewGeneration.current) return;
        setPreview(next);
      } catch (cause) {
        if (generation !== previewGeneration.current) return;
        captureException(cause, { operation: "previewOrder", marketId: market.id });
        setPreviewError("The order preview is temporarily unavailable.");
      } finally {
        if (generation === previewGeneration.current) setPreviewBusy(false);
      }
    }, 150);

    return () => window.clearTimeout(timer);
  }, [amountNumber, inputError, market.id, maxSlippageBps, orderType, price, selected.id, side, tradingOpen]);

  async function execute() {
    if (!canSubmit) return;
    if (!connected) {
      setWalletOpen(true);
      return;
    }
    setBusy(true);
    setSubmitError("");
    try {
      const clientRequestId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `order-${Date.now()}`;
      const prepared = await dataAdapter.prepareOrder({
        clientRequestId,
        marketId: market.id,
        outcomeId: selected.id,
        side,
        type: orderType,
        collateralAmount: side === "buy" ? amountNumber : undefined,
        shares: side === "sell" ? amountNumber : undefined,
        limitPrice: orderType === "limit" ? price : undefined,
        maxSlippageBps
      });
      setPreview(prepared.preview);
      if (prepared.walletRequest) {
        const walletResult = await executeWalletRequest(prepared.walletRequest);
        if (walletResult.status === "rejected") throw new Error(walletResult.message);
      }
      notify("Order request ready", `${side === "buy" ? "Buy" : "Sell"} ${prepared.preview.estimatedShares.toFixed(1)} ${selected.label} shares at ${Math.round(prepared.preview.estimatedPrice * 100)}¢.`, "trade", "orderEvents");
      setMobileOpen(false);
    } catch (cause) {
      captureException(cause, { operation: "prepareOrder", marketId: market.id });
      setSubmitError(cause instanceof Error && cause.message ? cause.message : "The order request could not be prepared. Review the inputs and try again.");
    } finally {
      setBusy(false);
    }
  }

  function renderClosed() {
    const resolved = market.status === "resolved";
    const maintenance = marketOpen && !tradingEnabled;
    const winner = [...market.outcomes].sort((a, b) => b.probability - a.probability)[0];
    const copy = maintenance ? maintenanceCopy : stateCopy[market.status];
    return <div className="ticket-content closed-ticket-content"><div className="ticket-head"><div><span className="eyebrow">Market status</span><h3>{market.shortQuestion}</h3><small><i />{copy.title}</small></div><button className="icon-button mobile-ticket-close" type="button" aria-label="Close market status" onClick={() => setMobileOpen(false)}><X size={18} /></button></div><div className={`closed-market-state ${maintenance ? "paused" : market.status}`}>{resolved ? <Trophy size={22} /> : maintenance || market.status === "paused" ? <PauseCircle size={22} /> : <Clock3 size={22} />}<span><strong>{copy.title}</strong><p>{copy.description}</p></span></div><div className="closed-outcome-list">{market.outcomes.map((item) => <div className={resolved && item.id === winner.id ? "winner" : ""} key={item.id}><span>{item.label}</span><strong>{item.probability}%</strong>{resolved && item.id === winner.id ? <em>Final outcome</em> : null}</div>)}</div><div className="closed-resolution-card"><span>Resolution source</span><strong>{market.resolutionSource}</strong><p>{market.resolutionRules}</p><small>{resolved ? `Resolved after ${formatDate(market.endDate)}` : maintenance ? "Order entry is disabled until interface policy re-enables trading." : `Scheduled end ${formatDate(market.endDate)}`}</small></div><p className="ticket-note"><ShieldCheck size={13} />The connected integration remains authoritative for market state, settlement and redemption eligibility.</p></div>;
  }

  function renderOpen(surface: "desktop" | "mobile") {
    const amountId = `${surface}-trade-amount`;
    const limitId = `${surface}-limit-price`;
    const estimatedProfit = preview && side === "buy" ? Math.max(preview.estimatedPayout - preview.estimatedCollateral, 0) : 0;
    const maxAmount = connected && side === "buy" && availableBalance !== undefined ? availableBalance : null;
    return <div className="ticket-content"><div className="ticket-head"><div><span className="eyebrow">Trade</span><h3>{market.shortQuestion}</h3><small><i />Market open · {appConfig.chainName}</small></div><button className="icon-button mobile-ticket-close" type="button" aria-label="Close trade ticket" onClick={() => setMobileOpen(false)}><X size={18} /></button></div><div className="segmented-control" aria-label="Trade side"><button type="button" aria-pressed={side === "buy"} className={side === "buy" ? "active" : ""} onClick={() => { setSide("buy"); setSubmitError(""); }}>Buy</button><button type="button" aria-pressed={side === "sell"} className={side === "sell" ? "active" : ""} onClick={() => { setSide("sell"); setSubmitError(""); }}>Sell</button></div><div className="ticket-field"><div className="ticket-label-row"><label>Outcome</label><span>Current probability</span></div><div className="outcome-selector">{market.outcomes.map((item) => <button type="button" aria-pressed={outcome === item.id} className={outcome === item.id ? "active" : ""} onClick={() => { setOutcome(item.id); setLimitPrice(String(item.probability)); setSubmitError(""); }} key={item.id}><span>{item.label}</span><strong>{item.probability}¢</strong><small className={item.change24h >= 0 ? "positive" : "negative"}>{item.change24h >= 0 ? "+" : ""}{item.change24h.toFixed(1)} today</small></button>)}</div></div><div className="ticket-field"><div className="ticket-label-row"><label>Order type</label><span className="info-trigger" tabIndex={0} role="note" aria-label="Market orders execute against available liquidity; limit orders wait for the chosen price"><Info size={13} /></span></div><div className="order-type-control"><button type="button" aria-pressed={orderType === "market"} className={orderType === "market" ? "active" : ""} onClick={() => { orderTypeTouched.current = true; setOrderType("market"); setSubmitError(""); }}><strong>Market</strong><small>Execute near {selected.probability}¢</small></button><button type="button" aria-pressed={orderType === "limit"} className={orderType === "limit" ? "active" : ""} onClick={() => { orderTypeTouched.current = true; setOrderType("limit"); setSubmitError(""); }}><strong>Limit</strong><small>Choose your price</small></button></div></div>{orderType === "limit" ? <div className="ticket-field"><label htmlFor={limitId}>Limit price</label><div className={invalidPrice ? "amount-input invalid" : "amount-input"}><span>¢</span><input id={limitId} inputMode="decimal" aria-invalid={invalidPrice} value={limitPrice} onChange={(event) => { setLimitPrice(cleanNumber(event.target.value)); setSubmitError(""); }} /><em>1–100¢</em></div></div> : null}<div className="ticket-field"><div className="ticket-label-row"><label htmlFor={amountId}>{side === "buy" ? "Amount" : "Shares"}</label><span>{side === "buy" ? "Collateral" : selected.label}</span></div><div className={amountNumber <= 0 ? "amount-input invalid" : "amount-input"}><span>{side === "buy" ? "$" : "#"}</span><input id={amountId} inputMode="decimal" aria-invalid={amountNumber <= 0} value={amount} onChange={(event) => { setAmount(cleanNumber(event.target.value)); setSubmitError(""); }} /><em>{side === "buy" ? appConfig.collateral : selected.label}</em></div><div className="quick-amounts" aria-label="Quick amount selection">{[10, 50, 100, 500].map((value) => <button type="button" aria-pressed={amount === String(value)} key={value} onClick={() => setAmount(String(value))}>{side === "buy" ? "$" : ""}{value}</button>)}{maxAmount !== null ? <button type="button" aria-pressed={amount === String(maxAmount)} onClick={() => setAmount(String(maxAmount))}>Max</button> : <button type="button" aria-pressed={amount === "1250"} onClick={() => setAmount("1250")}>{side === "buy" ? "$1,250" : "1,250"}</button>}</div></div>{error ? <div className="ticket-error" role="alert"><AlertCircle size={15} />{error}</div> : previewBusy ? <div className="ticket-ready" role="status"><LoaderCircle className="spin" size={15} />Refreshing order preview</div> : preview ? <div className="ticket-ready"><CheckCircle2 size={15} />Order preview ready</div> : null}<div className="trade-summary"><div><span>Execution price <Info size={13} /></span><strong>{preview ? `${Math.round(preview.estimatedPrice * 100)}¢` : "—"}</strong></div><div><span>Estimated shares</span><strong>{preview ? preview.estimatedShares.toFixed(2) : "—"}</strong></div><div><span>Estimated fee</span><strong>{preview ? formatCurrency(preview.estimatedFee) : "—"}</strong></div><div><span>Price impact</span><strong>{preview ? `${(preview.priceImpactBps / 100).toFixed(2)}%` : "—"}</strong></div><div><span>{side === "buy" ? "Maximum payout" : "Estimated proceeds"}</span><strong>{preview ? formatCurrency(preview.estimatedPayout) : "—"}</strong></div>{side === "buy" ? <div className="summary-highlight"><span>Potential profit</span><strong>{preview ? formatCurrency(estimatedProfit) : "—"}</strong></div> : null}</div><button className="primary-button ticket-submit" type="button" disabled={!canSubmit} onClick={() => void execute()}>{busy ? <><LoaderCircle className="spin" size={17} />Preparing order</> : connected ? `${side === "buy" ? "Buy" : "Sell"} ${selected.label}` : "Connect wallet to trade"}</button><p className="ticket-note"><ShieldCheck size={13} />Review price, fees, price impact and payout before wallet approval. Execution occurs only after the connected integration confirms the request.</p></div>;
  }

  const content = (surface: "desktop" | "mobile") => tradingOpen ? renderOpen(surface) : renderClosed();
  const mobileTitle = tradingOpen ? `Trade ${selected.label}` : marketOpen && !tradingEnabled ? maintenanceCopy.title : stateCopy[market.status].title;
  return <><aside className="trade-ticket desktop-ticket" id="trade-ticket" aria-label={tradingOpen ? "Trade ticket" : "Market status"}>{content("desktop")}</aside><button className={`mobile-trade-button status-${marketOpen && !tradingEnabled ? "paused" : market.status}`} type="button" aria-haspopup="dialog" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><span>{mobileTitle}<small>{tradingOpen ? orderType === "market" ? "Market order" : `Limit · ${limitPrice}¢` : marketOpen && !tradingEnabled ? "Interface maintenance" : market.status === "resolved" ? "View final outcome" : "View market status"}</small></span><strong>{tradingOpen ? `${selected.probability}¢` : market.status === "resolved" ? "Final" : "View"}</strong></button>{mobileOpen ? <div className="overlay mobile-trade-overlay" onMouseDown={() => !busy && setMobileOpen(false)}><aside className="trade-ticket mobile-ticket" role="dialog" aria-modal="true" aria-label={tradingOpen ? `Trade ${market.shortQuestion}` : `${market.shortQuestion} status`} onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle" />{content("mobile")}</aside></div> : null}</>;
}
