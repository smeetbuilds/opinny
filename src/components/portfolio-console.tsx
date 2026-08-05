"use client";

import Link from "next/link";
import { AlertCircle, ArrowUpRight, CheckCircle2, CircleDollarSign, LoaderCircle, Target, TrendingUp, WalletCards, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Position } from "@/core/contracts/domain";
import { dataAdapter } from "@/lib/data";
import { appConfig } from "@/lib/config";
import { formatCurrency } from "@/lib/format";
import { useApp } from "./app-provider";

type Tab = "open" | "resolved";

export function PortfolioConsole({ positions }: { positions: Position[] }) {
  const { connected, setWalletOpen, notify } = useApp();
  const [items, setItems] = useState(positions);
  const [tab, setTab] = useState<Tab>("open");
  const [selected, setSelected] = useState<Position[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const open = items.filter((position) => position.status === "open");
  const resolved = items.filter((position) => position.status !== "open");
  const claimable = resolved.filter((position) => position.status === "resolved" && (position.claimableAmount ?? 0) > 0);
  const value = open.reduce((sum, item) => sum + item.value, 0);
  const pnl = open.reduce((sum, item) => sum + item.pnl, 0);
  const invested = Math.max(value - pnl, 0);
  const returnPercent = invested ? (pnl / invested) * 100 : 0;
  const profitable = open.filter((position) => position.pnl >= 0).length;
  const claimableTotal = claimable.reduce((sum, position) => sum + (position.claimableAmount ?? 0), 0);
  const visible = tab === "open" ? open : resolved;
  const redeemTotal = selected.reduce((sum, position) => sum + (position.claimableAmount ?? 0), 0);

  useEffect(() => {
    if (!selected.length) return;
    const previous = document.body.style.overflow;
    const close = (event: KeyboardEvent) => event.key === "Escape" && !busy && setSelected([]);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", close);
    };
  }, [busy, selected.length]);

  function requestRedeem(next: Position[]) {
    if (!connected) {
      setWalletOpen(true);
      return;
    }
    setError("");
    setSelected(next);
  }

  async function redeem() {
    if (!selected.length) return;
    setBusy(true);
    setError("");
    try {
      const results = await Promise.all(selected.map((position) => dataAdapter.redeemPosition(position.id)));
      const rejected = results.find((result) => result.status === "rejected");
      if (rejected) throw new Error(rejected.message);
      const ids = new Set(selected.map((position) => position.id));
      setItems((current) => current.map((position) => ids.has(position.id) ? { ...position, status: "claimed", claimableAmount: 0 } : position));
      notify("Redemption prepared", `${formatCurrency(redeemTotal)} ${appConfig.collateral} is ready for settlement confirmation.`, "funding");
      setSelected([]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The redemption request could not be prepared.");
    } finally {
      setBusy(false);
    }
  }

  const summaries = useMemo(() => ({ total: value + 3842.16 + claimableTotal, claimableTotal }), [claimableTotal, value]);

  return (
    <>
      <div className="portfolio-summary-grid">
        <article className="balance-card featured-balance"><div><span>Portfolio value</span><strong>{formatCurrency(summaries.total)}</strong><em className={pnl >= 0 ? "positive" : "negative"}>{pnl >= 0 ? "+" : ""}{formatCurrency(pnl)} open P&amp;L · {returnPercent.toFixed(1)}%</em></div><div className="mini-chart" aria-label="Portfolio value trend"><svg viewBox="0 0 240 76" preserveAspectRatio="none"><polyline points="0,65 24,58 48,61 72,46 96,50 120,38 144,42 168,29 192,34 216,19 240,12" /></svg></div></article>
        <article className="balance-card"><CircleDollarSign size={18} /><span>Available collateral</span><strong>$3,842.16</strong><small>{appConfig.collateral} ready to deploy</small></article>
        <article className="balance-card"><TrendingUp size={18} /><span>Open positions</span><strong>{open.length}</strong><small>{formatCurrency(value)} market value</small></article>
        <article className={`balance-card claimable-card ${claimableTotal ? "active" : ""}`}><WalletCards size={18} /><span>Claimable</span><strong>{formatCurrency(claimableTotal)}</strong><small>{claimable.length} resolved {claimable.length === 1 ? "position" : "positions"}</small>{claimableTotal ? <button type="button" onClick={() => requestRedeem(claimable)}>Redeem all</button> : null}</article>
      </div>

      <div className="portfolio-health-strip"><span><Target size={16} /><small>Positions in profit</small><strong>{profitable} of {open.length}</strong></span><span><TrendingUp size={16} /><small>Net return</small><strong className={returnPercent >= 0 ? "positive" : "negative"}>{returnPercent >= 0 ? "+" : ""}{returnPercent.toFixed(1)}%</strong></span><span><CircleDollarSign size={16} /><small>Capital deployed</small><strong>{formatCurrency(invested)}</strong></span><Link href="/markets">Find opportunities <ArrowUpRight size={14} /></Link></div>

      <section className="data-panel portfolio-positions-panel" aria-labelledby="positions-title">
        <div className="table-title portfolio-table-title"><div><h2 id="positions-title">Positions</h2><span>{open.length} open · {claimable.length} ready to redeem</span></div><div className="panel-tabs" aria-label="Position status"><button type="button" className={tab === "open" ? "active" : ""} onClick={() => setTab("open")}>Open <span>{open.length}</span></button><button type="button" className={tab === "resolved" ? "active" : ""} onClick={() => setTab("resolved")}>Resolved <span>{resolved.length}</span></button></div></div>
        {visible.length ? <div className="responsive-table account-data-table portfolio-responsive-table"><table><thead><tr><th>Market</th><th>Outcome</th><th>Shares</th><th>{tab === "open" ? "Avg. price" : "Result"}</th><th>{tab === "open" ? "Current" : "Claimable"}</th><th>Value</th><th>{tab === "open" ? "P&L" : "Status"}</th><th /></tr></thead><tbody>{visible.map((position) => <tr key={position.id}><td className="wide-cell" data-label="Market"><Link href={`/market/${position.marketSlug}`}>{position.marketQuestion}<small>Position {position.id}</small></Link></td><td data-label="Outcome"><span className="outcome-chip">{position.outcome}</span></td><td data-label="Shares">{position.shares.toLocaleString()}</td><td data-label={tab === "open" ? "Avg. price" : "Result"}>{tab === "open" ? `${Math.round(position.averagePrice * 100)}¢` : position.resolvedOutcome}</td><td data-label={tab === "open" ? "Current" : "Claimable"}>{tab === "open" ? `${Math.round(position.currentPrice * 100)}¢` : formatCurrency(position.claimableAmount ?? 0)}</td><td data-label="Value">{formatCurrency(position.value)}</td><td data-label={tab === "open" ? "P&L" : "Status"}>{tab === "open" ? <span className={position.pnl >= 0 ? "positive" : "negative"}>{position.pnl >= 0 ? "+" : ""}{formatCurrency(position.pnl)}<small>{position.pnlPercent.toFixed(1)}%</small></span> : <span className={`status-pill ${position.status}`}>{position.status}</span>}</td><td>{position.status === "resolved" && (position.claimableAmount ?? 0) > 0 ? <button className="row-action claim-action" type="button" onClick={() => requestRedeem([position])}>Redeem</button> : position.status === "open" ? <Link className="row-action" href={`/market/${position.marketSlug}`}>Trade <ArrowUpRight size={14} /></Link> : <span className="settled-label"><CheckCircle2 size={14} />Settled</span>}</td></tr>)}</tbody></table></div> : <div className="table-empty large"><CheckCircle2 size={24} /><strong>{tab === "open" ? "No open positions" : "No resolved positions"}</strong><span>{tab === "open" ? "Explore a market to start building a position." : "Resolved and claimed positions will appear here."}</span>{tab === "open" ? <Link href="/markets">Explore markets</Link> : null}</div>}
      </section>

      {selected.length ? <div className="overlay operation-overlay" onMouseDown={() => !busy && setSelected([])}><section className="operation-dialog redeem-dialog" role="dialog" aria-modal="true" aria-labelledby="redeem-title" onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle" /><header><span className="operation-icon success"><WalletCards size={21} /></span><div><span className="eyebrow">Resolved positions</span><h2 id="redeem-title">Redeem {formatCurrency(redeemTotal)}</h2><p>Prepare settlement for {selected.length} winning {selected.length === 1 ? "position" : "positions"} through the connected integration.</p></div><button className="icon-button" type="button" disabled={busy} onClick={() => setSelected([])} aria-label="Close redemption dialog"><X size={17} /></button></header><div className="operation-summary"><span><small>Positions</small><strong>{selected.length}</strong></span><span><small>Collateral</small><strong>{appConfig.collateral}</strong></span><span><small>Claimable</small><strong>{formatCurrency(redeemTotal)}</strong></span><span><small>Network</small><strong>{appConfig.chainName}</strong></span></div><div className="operation-notice"><AlertCircle size={16} /><span>The final amount and settlement transaction must be confirmed by the connected backend or smart contract.</span></div>{error ? <p className="dialog-error" role="alert">{error}</p> : null}<footer><button className="secondary-button" type="button" disabled={busy} onClick={() => setSelected([])}>Not now</button><button className="primary-button" type="button" disabled={busy} onClick={redeem}>{busy ? <><LoaderCircle className="spin" size={16} />Preparing</> : "Prepare redemption"}</button></footer></section></div> : null}
    </>
  );
}
