"use client";

import { useMemo, useState } from "react";
import { ArrowDownUp, ChevronDown, Info, X } from "lucide-react";
import type { Market } from "@/core/contracts/domain";
import { formatCurrency } from "@/lib/format";
import { useApp } from "./app-provider";

export function TradeTicket({ market }: { market: Market }) {
  const { connected, setWalletOpen, notify } = useApp();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [outcome, setOutcome] = useState(market.outcomes[0].id);
  const [amount, setAmount] = useState("100");
  const [limitPrice, setLimitPrice] = useState(String(market.outcomes[0].probability));
  const [mobileOpen, setMobileOpen] = useState(false);

  const selected = market.outcomes.find((item) => item.id === outcome) ?? market.outcomes[0];
  const price = orderType === "limit" ? (Number(limitPrice) || 0) / 100 : selected.probability / 100;
  const amountNumber = Number(amount) || 0;
  const shares = useMemo(() => side === "buy" ? (price > 0 ? amountNumber / price : 0) : amountNumber, [side, price, amountNumber]);
  const settlementValue = side === "buy" ? shares : shares * price;

  const execute = () => {
    if (!connected) {
      setWalletOpen(true);
      return;
    }
    notify("Demo order prepared", `${side === "buy" ? "Buy" : "Sell"} ${shares.toFixed(1)} ${selected.label} shares at ${Math.round(price * 100)}¢.`);
    setMobileOpen(false);
  };

  const content = (
    <div className="ticket-content">
      <div className="ticket-head"><div><span className="eyebrow">Trade</span><h3>{market.shortQuestion}</h3></div><button className="icon-button mobile-ticket-close" aria-label="Close trade ticket" onClick={() => setMobileOpen(false)}><X size={18} /></button></div>
      <div className="segmented-control"><button className={side === "buy" ? "active" : ""} onClick={() => setSide("buy")}>Buy</button><button className={side === "sell" ? "active" : ""} onClick={() => setSide("sell")}>Sell</button></div>
      <div className="ticket-field">
        <label>Outcome</label>
        <div className="outcome-selector">
          {market.outcomes.map((item) => <button className={outcome === item.id ? "active" : ""} onClick={() => { setOutcome(item.id); setLimitPrice(String(item.probability)); }} key={item.id}><span>{item.label}</span><strong>{item.probability}¢</strong></button>)}
        </div>
      </div>
      <div className="ticket-field split-field">
        <label>Order type</label>
        <button className="inline-select" onClick={() => setOrderType((value) => value === "market" ? "limit" : "market")}><span>{orderType === "market" ? "Market" : "Limit"}</span><ChevronDown size={15} /></button>
      </div>
      {orderType === "limit" ? <div className="ticket-field"><label htmlFor="limit-price">Limit price</label><div className="amount-input"><span>¢</span><input id="limit-price" inputMode="decimal" value={limitPrice} onChange={(event) => setLimitPrice(event.target.value)} /><em>0–100¢</em></div></div> : null}
      <div className="ticket-field"><label htmlFor="trade-amount">{side === "buy" ? "Amount" : "Shares"}</label><div className="amount-input"><span>{side === "buy" ? "$" : "#"}</span><input id="trade-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} /><em>{side === "buy" ? "USDC" : selected.label}</em></div><div className="quick-amounts">{[10, 50, 100, 500].map((value) => <button key={value} onClick={() => setAmount(String(value))}>{side === "buy" ? "$" : ""}{value}</button>)}<button onClick={() => setAmount("1250")}>Max</button></div></div>
      <div className="trade-summary">
        <div><span>Average price <Info size={13} /></span><strong>{Math.round(price * 100)}¢</strong></div>
        <div><span>Estimated shares</span><strong>{shares.toFixed(2)}</strong></div>
        <div><span>{side === "buy" ? "Potential payout" : "Estimated proceeds"}</span><strong>{formatCurrency(settlementValue)}</strong></div>
        <div><span>Network</span><strong className="network-value"><i />Polygon</strong></div>
      </div>
      <button className="primary-button ticket-submit" onClick={execute}>{connected ? `${side === "buy" ? "Buy" : "Sell"} ${selected.label}` : "Connect wallet to trade"}</button>
      <p className="ticket-note"><ArrowDownUp size={13} />Transactions use crypto collateral only. Final amounts are confirmed by the connected execution backend.</p>
    </div>
  );

  return (
    <>
      <aside className="trade-ticket desktop-ticket">{content}</aside>
      <button className="mobile-trade-button" onClick={() => setMobileOpen(true)}><span>Trade {selected.label}</span><strong>{selected.probability}¢</strong></button>
      {mobileOpen ? <div className="overlay" onMouseDown={() => setMobileOpen(false)}><aside className="trade-ticket mobile-ticket" onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle" />{content}</aside></div> : null}
    </>
  );
}
