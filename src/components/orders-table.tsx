"use client";

import Link from "next/link";
import { ArrowUpRight, Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import type { UserOrder } from "@/core/contracts/domain";
import { formatDate } from "@/lib/format";

type Filter = "all" | "open" | "filled" | "cancelled";

const filterLabels: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "filled", label: "Filled" },
  { value: "cancelled", label: "Cancelled" }
];

export function OrdersTable({ orders }: { orders: UserOrder[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "largest">("newest");

  const counts = useMemo(() => ({
    all: orders.length,
    open: orders.filter((order) => order.status === "open" || order.status === "partially-filled").length,
    filled: orders.filter((order) => order.status === "filled").length,
    cancelled: orders.filter((order) => order.status === "cancelled").length
  }), [orders]);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const result = orders.filter((order) => {
      const matchesFilter = filter === "all" || (filter === "open" ? order.status === "open" || order.status === "partially-filled" : order.status === filter);
      const matchesQuery = !normalized || `${order.marketQuestion} ${order.outcome} ${order.id}`.toLowerCase().includes(normalized);
      return matchesFilter && matchesQuery;
    });

    return result.sort((a, b) => {
      if (sort === "largest") return b.shares - a.shares;
      const direction = sort === "newest" ? -1 : 1;
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
    });
  }, [filter, orders, query, sort]);

  const totalShares = orders.reduce((sum, order) => sum + order.shares, 0);
  const filledShares = orders.reduce((sum, order) => sum + order.filled, 0);
  const fillRate = totalShares ? (filledShares / totalShares) * 100 : 0;

  return (
    <section className="data-panel orders-panel" aria-labelledby="orders-title">
      <div className="table-title orders-titlebar">
        <div><h2 id="orders-title">Order history</h2><span>{visible.length} of {orders.length} orders shown</span></div>
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
        <div className="responsive-table account-data-table">
          <table>
            <thead><tr><th>Market</th><th>Side</th><th>Type</th><th>Price</th><th>Shares</th><th>Filled</th><th>Status</th><th>Date</th><th /></tr></thead>
            <tbody>{visible.map((order) => {
              const progress = order.shares ? Math.min((order.filled / order.shares) * 100, 100) : 0;
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
                  <td><Link className="row-action" href={`/market/${order.marketSlug}`} aria-label={`Open ${order.marketQuestion}`}>View <ArrowUpRight size={14} /></Link></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      ) : (
        <div className="table-empty large"><SearchX size={24} /><strong>No matching orders</strong><span>Change the status filter or search another market.</span><button type="button" onClick={() => { setFilter("all"); setQuery(""); }}>Reset filters</button></div>
      )}
    </section>
  );
}
