"use client";

import Link from "next/link";
import { AlertTriangle, ArrowUpRight, LoaderCircle, Search, SearchX, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { UserOrder } from "@/core/contracts/domain";
import { dataAdapter } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { useApp } from "./app-provider";

type Filter = "all" | "open" | "filled" | "cancelled";
const filterLabels: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "filled", label: "Filled" },
  { value: "cancelled", label: "Cancelled" }
];

export function OrdersTable({ orders }: { orders: UserOrder[] }) {
  const { connected, setWalletOpen, notify } = useApp();
  const [items, setItems] = useState(orders);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "largest">("newest");
  const [selected, setSelected] = useState<UserOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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

  const counts = useMemo(() => ({
    all: items.length,
    open: items.filter((order) => order.status === "open" || order.status === "partially-filled").length,
    filled: items.filter((order) => order.status === "filled").length,
    cancelled: items.filter((order) => order.status === "cancelled").length
  }), [items]);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items
      .filter((order) => {
        const matchesFilter = filter === "all" || (filter === "open" ? order.status === "open" || order.status === "partially-filled" : order.status === filter);
        return matchesFilter && (!normalized || `${order.marketQuestion} ${order.outcome} ${order.id}`.toLowerCase().includes(normalized));
      })
      .sort((a, b) => {
        if (sort === "largest") return b.shares - a.shares;
        const direction = sort === "newest" ? -1 : 1;
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
      });
  }, [filter, items, query, sort]);

  const totalShares = items.reduce((sum, order) => sum + order.shares, 0);
  const filledShares = items.reduce((sum, order) => sum + order.filled, 0);
  const fillRate = totalShares ? (filledShares / totalShares) * 100 : 0;

  function requestCancellation(order: UserOrder) {
    if (!connected) {
      setWalletOpen(true);
      return;
    }
    setError("");
    setSelected(order);
  }

  async function cancelSelected() {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const result = await dataAdapter.cancelOrder(selected.id);
      if (result.status === "rejected") throw new Error(result.message);
      setItems((current) => current.map((order) => order.id === selected.id ? { ...order, status: "cancelled" } : order));
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
      <section className="data-panel orders-panel" aria-labelledby="orders-title">
        <div className="table-title orders-titlebar">
          <div><h2 id="orders-title">Order history</h2><span>{visible.length} of {items.length} orders shown</span></div>
          <div className="order-health"><span><small>Open</small><strong>{counts.open}</strong></span><span><small>Fill rate</small><strong>{fillRate.toFixed(0)}%</strong></span></div>
        </div>

        <div className="data-toolbar">
          <div className="panel-tabs" aria-label="Order status filter">
            {filterLabels.map((item) => <button type="button" aria-pressed={filter === item.value} className={filter === item.value ? "active" : ""} onClick={() => setFilter(item.value)} key={item.value}>{item.label}<span>{counts[item.value]}</span></button>)}
          </div>
          <label className="table-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search market or order ID" aria-label="Search orders" /></label>
          <label className="table-sort"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} aria-label="Sort orders"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="largest">Largest</option></select></label>
        </div>

        {visible.length ? (
          <div className="responsive-table account-data-table orders-responsive-table">
            <table>
              <thead><tr><th>Market</th><th>Side</th><th>Type</th><th>Price</th><th>Shares</th><th>Filled</th><th>Status</th><th>Date</th><th /></tr></thead>
              <tbody>{visible.map((order) => {
                const progress = order.shares ? Math.min((order.filled / order.shares) * 100, 100) : 0;
                const cancellable = order.status === "open" || order.status === "partially-filled";
                return (
                  <tr key={order.id}>
                    <td className="wide-cell" data-label="Market"><Link href={`/market/${order.marketSlug}`}>{order.marketQuestion}<small>{order.outcome} · {order.id}</small></Link></td>
                    <td data-label="Side"><span className={`side-pill ${order.side}`}>{order.side}</span></td>
                    <td data-label="Type" className="capitalize">{order.type}</td>
                    <td data-label="Price">{Math.round(order.price * 100)}¢</td>
                    <td data-label="Shares">{order.shares.toLocaleString()}</td>
                    <td data-label="Filled"><div className="fill-cell"><span>{order.filled.toLocaleString()} <small>{progress.toFixed(0)}%</small></span><i><b style={{ width: `${progress}%` }} /></i></div></td>
                    <td data-label="Status"><span className={`status-pill ${order.status}`}>{order.status.replace("-", " ")}</span></td>
                    <td data-label="Date">{formatDate(order.createdAt)}</td>
                    <td className="order-row-actions">{cancellable ? <button className="row-action danger-action" type="button" onClick={() => requestCancellation(order)}>Cancel</button> : <Link className="row-action" href={`/market/${order.marketSlug}`} aria-label={`Open ${order.marketQuestion}`}>View <ArrowUpRight size={14} /></Link>}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        ) : <div className="table-empty large"><SearchX size={24} /><strong>No matching orders</strong><span>Change the status filter or search another market.</span><button type="button" onClick={() => { setFilter("all"); setQuery(""); }}>Reset filters</button></div>}
      </section>

      {selected ? (
        <div className="overlay operation-overlay" onMouseDown={() => !busy && setSelected(null)}>
          <section className="operation-dialog" role="dialog" aria-modal="true" aria-labelledby="cancel-order-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <header><span className="operation-icon warning"><AlertTriangle size={21} /></span><div><span className="eyebrow">Order action</span><h2 id="cancel-order-title">Cancel remaining order?</h2><p>Filled shares stay in your position. Only the unmatched remainder will be cancelled.</p></div><button className="icon-button" type="button" disabled={busy} onClick={() => setSelected(null)} aria-label="Close cancellation dialog"><X size={17} /></button></header>
            <div className="operation-summary"><span><small>Market</small><strong>{selected.marketQuestion}</strong></span><span><small>Outcome</small><strong>{selected.outcome}</strong></span><span><small>Filled</small><strong>{selected.filled.toLocaleString()} / {selected.shares.toLocaleString()}</strong></span><span><small>Remaining</small><strong>{Math.max(selected.shares - selected.filled, 0).toLocaleString()} shares</strong></span></div>
            {error ? <p className="dialog-error" role="alert">{error}</p> : null}
            <footer><button className="secondary-button" type="button" disabled={busy} onClick={() => setSelected(null)}>Keep order</button><button className="primary-button destructive-button" type="button" disabled={busy} onClick={cancelSelected}>{busy ? <><LoaderCircle className="spin" size={16} />Cancelling</> : "Cancel remainder"}</button></footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
