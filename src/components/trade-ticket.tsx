"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Info, LoaderCircle, ShieldCheck, X } from "lucide-react";
import type { Market } from "@/core/contracts/domain";
import { formatCurrency } from "@/lib/format";
import { appConfig } from "@/lib/config";
import { dataAdapter } from "@/lib/data";
import { useApp } from "./app-provider";

type TradeEvent = CustomEvent<{ outcomeId: string }>;
const cleanNumber = (value: string) => value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");

export function TradeTicket({ market }: { market: Market }) {
  const { connected, setWalletOpen, notify } = useApp();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [outcome, setOutcome] = useState(market.outcomes[0].id);
  const [amount, setAmount] = useState("100");
  const [limitPrice, setLimitPrice] = useState(String(market.outcomes[0].probability));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const selected = market.outcomes.find((item) => item.id === outcome) ?? market.outcomes[0];
  const price = orderType === "limit" ? (Number(limitPrice) || 0) / 100 : selected.probability / 100;
  const amountNumber = Number(amount) || 0;
  const shares = useMemo(() => side === "buy" ? (price > 0 ? amountNumber / price : 0) : amountNumber, [side, price, amountNumber]);
  const grossSettlement = side === "buy" ? shares : shares * price;
  const fee = Math.max((side === "buy" ? amountNumber : grossSettlement) * 0.002, 0);
  const netSettlement = Math.max(grossSettlement - fee, 0);
  const potentialProfit = side === "buy" ? Math.max(shares - amountNumber - fee, 0) : 0;
  const invalidPrice = orderType === "limit" && (Number(limitPrice) <= 0 || Number(limitPrice) > 100);
  const inputError = amountNumber <= 0 ? `Enter ${side === "buy" ? "an amount" : "a share quantity"} greater than zero.` : invalidPrice ? "Limit price must be between 1¢ and 100¢." : "";
  const error = inputError || submitError;
  const canSubmit = !inputError && price > 0 && !busy;

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
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", close);
    };
  }, [mobileOpen]);

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
        maxSlippageBps: 100
      });
      notify(
        "Order request ready",
        `${side === "buy" ? "Buy" : "Sell"} ${prepared.preview.estimatedShares.toFixed(1)} ${selected.label} shares at ${Math.round(prepared.preview.estimatedPrice * 100)}¢.`,
        "trade"
      );
      setMobileOpen(false);
    } catch {
      setSubmitError("The order request could not be prepared. Review the inputs and try again.");
    } finally {
      setBusy(false);
    }
  }

  const renderContent = (surface: "desktop" | "mobile") => {
    const amountId = `${surface}-trade-amount`;
    const limitId = `${surface}-limit-price`;
    return (
      <div className="ticket-content">
        <div className="ticket-head">
          <div><span className="eyebrow">Trade</span><h3>{market.shortQuestion}</h3><small><i />Market open · {appConfig.chainName}</small></div>
          <button className="icon-button mobile-ticket-close" type="button" aria-label="Close trade ticket" onClick={() => setMobileOpen(false)}><X size={18} /></button>
        </div>

        <div className="segmented-control" aria-label="Trade side">
          <button type="button" aria-pressed={side === "buy"} className={side === "buy" ? "active" : ""} onClick={() => { setSide("buy"); setSubmitError(""); }}>Buy</button>
          <button type="button" aria-pressed={side === "sell"} className={side === "sell" ? "active" : ""} onClick={() => { setSide("sell"); setSubmitError(""); }}>Sell</button>
        </div>

        <div className="ticket-field">
          <div className="ticket-label-row"><label>Outcome</label><span>Current probability</span></div>
          <div className="outcome-selector">
            {market.outcomes.map((item) => (
              <button type="button" aria-pressed={outcome === item.id} className={outcome === item.id ? "active" : ""} onClick={() => { setOutcome(item.id); setLimitPrice(String(item.probability)); setSubmitError(""); }} key={item.id}>
                <span>{item.label}</span><strong>{item.probability}¢</strong><small className={item.change24h >= 0 ? "positive" : "negative"}>{item.change24h >= 0 ? "+" : ""}{item.change24h.toFixed(1)} today</small>
              </button>
            ))}
          </div>
        </div>

        <div className="ticket-field">
          <div className="ticket-label-row"><label>Order type</label><span className="info-trigger" aria-label="Market orders execute against available liquidity; limit orders wait for the chosen price"><Info size={13} /></span></div>
          <div className="order-type-control">
            <button type="button" aria-pressed={orderType === "market"} className={orderType === "market" ? "active" : ""} onClick={() => { setOrderType("market"); setSubmitError(""); }}><strong>Market</strong><small>Execute near {selected.probability}¢</small></button>
            <button type="button" aria-pressed={orderType === "limit"} className={orderType === "limit" ? "active" : ""} onClick={() => { setOrderType("limit"); setSubmitError(""); }}><strong>Limit</strong><small>Choose your price</small></button>
          </div>
        </div>

        {orderType === "limit" ? <div className="ticket-field"><label htmlFor={limitId}>Limit price</label><div className={invalidPrice ? "amount-input invalid" : "amount-input"}><span>¢</span><input id={limitId} inputMode="decimal" aria-invalid={invalidPrice} value={limitPrice} onChange={(event) => { setLimitPrice(cleanNumber(event.target.value)); setSubmitError(""); }} /><em>1–100¢</em></div></div> : null}

        <div className="ticket-field">
          <div className="ticket-label-row"><label htmlFor={amountId}>{side === "buy" ? "Amount" : "Shares"}</label><span>{side === "buy" ? "Collateral" : selected.label}</span></div>
          <div className={amountNumber <= 0 ? "amount-input invalid" : "amount-input"}><span>{side === "buy" ? "$" : "#"}</span><input id={amountId} inputMode="decimal" aria-invalid={amountNumber <= 0} value={amount} onChange={(event) => { setAmount(cleanNumber(event.target.value)); setSubmitError(""); }} /><em>{side === "buy" ? appConfig.collateral : selected.label}</em></div>
          <div className="quick-amounts" aria-label="Quick amount selection">{[10, 50, 100, 500].map((value) => <button type="button" aria-pressed={amount === String(value)} key={value} onClick={() => setAmount(String(value))}>{side === "buy" ? "$" : ""}{value}</button>)}<button type="button" aria-pressed={amount === "1250"} onClick={() => setAmount("1250")}>Max</button></div>
        </div>

        {error ? <div className="ticket-error" role="alert"><AlertCircle size={15} />{error}</div> : <div className="ticket-ready"><CheckCircle2 size={15} />Order preview ready</div>}

        <div className="trade-summary">
          <div><span>Execution price <Info size={13} /></span><strong>{Math.round(price * 100)}¢</strong></div>
          <div><span>Estimated shares</span><strong>{shares.toFixed(2)}</strong></div>
          <div><span>Estimated fee</span><strong>{formatCurrency(fee)}</strong></div>
          <div><span>{side === "buy" ? "Maximum payout" : "Estimated proceeds"}</span><strong>{formatCurrency(netSettlement)}</strong></div>
          {side === "buy" ? <div className="summary-highlight"><span>Potential profit</span><strong>{formatCurrency(potentialProfit)}</strong></div> : null}
        </div>

        <button className="primary-button ticket-submit" type="button" disabled={!canSubmit} onClick={execute}>{busy ? <><LoaderCircle className="spin" size={17} />Preparing order</> : connected ? `${side === "buy" ? "Buy" : "Sell"} ${selected.label}` : "Connect wallet to trade"}</button>
        <p className="ticket-note"><ShieldCheck size={13} />Review price, fees and payout before wallet approval. Execution occurs only after the connected integration confirms the request.</p>
      </div>
    );
  };

  return (
    <>
      <aside className="trade-ticket desktop-ticket" id="trade-ticket" aria-label="Trade ticket">{renderContent("desktop")}</aside>
      <button className="mobile-trade-button" type="button" aria-haspopup="dialog" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><span>Trade {selected.label}<small>{orderType === "market" ? "Market order" : `Limit · ${limitPrice}¢`}</small></span><strong>{selected.probability}¢</strong></button>
      {mobileOpen ? <div className="overlay mobile-trade-overlay" onMouseDown={() => setMobileOpen(false)}><aside className="trade-ticket mobile-ticket" role="dialog" aria-modal="true" aria-label={`Trade ${market.shortQuestion}`} onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle" />{renderContent("mobile")}</aside></div> : null}
    </>
  );
}
