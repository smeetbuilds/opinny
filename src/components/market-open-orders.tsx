"use client";

import Link from "next/link";
import { AlertTriangle, ArrowUpRight, LoaderCircle, RefreshCw, Wallet, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { UserOrder } from "@/core/contracts/domain";
import { dataAdapter } from "@/lib/data";
import { useApp } from "./app-provider";

export function MarketOpenOrders({ marketSlug }: { marketSlug: string }) {
  const { connected, setWalletOpen, notify } = useApp();
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [selected, setSelected] = useState<UserOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [error, setError] = useState("");

  const openOrders = useMemo(() => orders.filter((order) => order.status === "open" || order.status === "partially-filled"), [orders]);

  useEffect(() => {
    if (!connected) {
      setOrders([]);
      setLoadError("");
      return;
    }

    let active = true;
    setLoading(true);
    setLoadError("");
    void dataAdapter.getOrders()
      .then((items) => {
        if (!active) return;
        setOrders(items.filter((order) => order.marketSlug === marketSlug));
      })
      .catch(() => {
        if (!active) return;
        setLoadError("Account orders could not be loaded from the connected integration.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [connected, marketSlug, reloadToken]);

  useEffect(() => {
    if (!selected) return;
    const previous = document.body.style.overflow;
    const close = (event: KeyboardEvent) => event.key === "Escape" && !busy && setSelected(null);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", close);
    };
  }, [busy, selected]);

  function requestCancel(order: UserOrder) {
    if (!connected) {
      setWalletOpen(true);
      return;
    }
    setError("");
    setSelected(order);
  }

  async function cancelOrder() {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const result = await dataAdapter.cancelOrder(selected.id);
      if (result.status === "rejected") throw new Error(result.message);
      setOrders((current) => current.map((order) => order.id === selected.id ? { ...order, status: "cancelled" } : order));
      notify("Cancellation requested", result.message, "trade");
      setSelected(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The order could not be cancelled. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="market-orders-card" aria-labelledby="market-open-orders-title">
        <div className="table-title market-orders-titlebar">
          <div><h3 id="market-open-orders-title">Your open orders</h3><span>Manage unmatched limit orders without leaving this market.</span></div>
          <Link href="/orders">All orders <ArrowUpRight size={13} /></Link>
        </div>

        {!connected ? (
          <div className="market-orders-locked">
            <span><Wallet size={18} /></span>
            <div><strong>Connect to manage orders</strong><p>Account-specific orders are requested only after wallet connection.</p></div>
            <button className="secondary-button compact" type="button" onClick={() => setWalletOpen(true)}>Connect wallet</button>
          </div>
        ) : loading ? (
          <div className="market-orders-empty market-orders-loading" role="status"><LoaderCircle className="spin" size={17} /><strong>Loading open orders</strong><span>Reading account state from the connected integration.</span></div>
        ) : loadError ? (
          <div className="market-orders-empty market-orders-error" role="alert"><strong>Orders unavailable</strong><span>{loadError}</span><button className="secondary-button compact" type="button" onClick={() => setReloadToken((value) => value + 1)}><RefreshCw size={13} />Retry</button></div>
        ) : openOrders.length ? (
          <div className="market-orders-list">
            {openOrders.map((order) => {
              const remaining = Math.max(order.shares - order.filled, 0);
              const fillPercent = order.shares ? Math.min((order.filled / order.shares) * 100, 100) : 0;
              return (
                <article key={order.id}>
                  <div className="market-order-main">
                    <span className={`side-pill ${order.side}`}>{order.side}</span>
                    <span><strong>{order.outcome} · {order.type}</strong><small>{Math.round(order.price * 100)}¢ · {remaining.toLocaleString()} shares remaining</small></span>
                  </div>
                  <div className="market-order-progress" aria-label={`${fillPercent.toFixed(0)} percent filled`}><span>{order.filled.toLocaleString()} / {order.shares.toLocaleString()}</span><i><b style={{ width: `${fillPercent}%` }} /></i></div>
                  <button className="row-action danger-action" type="button" onClick={() => requestCancel(order)}>Cancel</button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="market-orders-empty"><strong>No open orders in this market</strong><span>New limit orders will appear here while they are waiting to fill.</span></div>
        )}
      </section>

      {selected ? (
        <div className="overlay operation-overlay" onMouseDown={() => !busy && setSelected(null)}>
          <section className="operation-dialog" role="dialog" aria-modal="true" aria-labelledby="market-cancel-order-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <header><span className="operation-icon warning"><AlertTriangle size={21} /></span><div><span className="eyebrow">Open order</span><h2 id="market-cancel-order-title">Cancel remaining order?</h2><p>Any shares already filled remain in your position. Only the unmatched remainder is cancelled.</p></div><button className="icon-button" type="button" disabled={busy} onClick={() => setSelected(null)} aria-label="Close cancellation dialog"><X size={17} /></button></header>
            <div className="operation-summary"><span><small>Outcome</small><strong>{selected.outcome}</strong></span><span><small>Limit price</small><strong>{Math.round(selected.price * 100)}¢</strong></span><span><small>Filled</small><strong>{selected.filled.toLocaleString()} shares</strong></span><span><small>Remaining</small><strong>{Math.max(selected.shares - selected.filled, 0).toLocaleString()} shares</strong></span></div>
            {error ? <p className="dialog-error" role="alert">{error}</p> : null}
            <footer><button className="secondary-button" type="button" disabled={busy} onClick={() => setSelected(null)}>Keep order</button><button className="primary-button destructive-button" type="button" disabled={busy} onClick={() => void cancelOrder()}>{busy ? <><LoaderCircle className="spin" size={16} />Cancelling</> : "Cancel remainder"}</button></footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
