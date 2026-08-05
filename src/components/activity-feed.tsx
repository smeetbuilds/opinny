"use client";

import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Download, Gift, Repeat2, Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import type { ActivityItem } from "@/core/contracts/domain";
import { formatCurrency } from "@/lib/format";

type Filter = "all" | "trades" | "funding" | "rewards" | "resolutions";
const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All activity" },
  { value: "trades", label: "Trades" },
  { value: "funding", label: "Funding" },
  { value: "rewards", label: "Rewards" },
  { value: "resolutions", label: "Resolutions" }
];
const icons = { trade: Repeat2, deposit: ArrowDownLeft, withdrawal: ArrowUpRight, resolution: CheckCircle2, reward: Gift };

function matchesFilter(item: ActivityItem, filter: Filter) {
  if (filter === "all") return true;
  if (filter === "trades") return item.type === "trade";
  if (filter === "funding") return item.type === "deposit" || item.type === "withdrawal";
  if (filter === "rewards") return item.type === "reward";
  return item.type === "resolution";
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => Object.fromEntries(filters.map(({ value }) => [value, items.filter((item) => matchesFilter(item, value)).length])) as Record<Filter, number>, [items]);
  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => matchesFilter(item, filter) && (!normalized || `${item.title} ${item.description} ${item.type}`.toLowerCase().includes(normalized)));
  }, [filter, items, query]);

  function exportCsv() {
    const rows = [["ID", "Type", "Title", "Description", "Amount", "Time"], ...visible.map((item) => [item.id, item.type, item.title, item.description, item.amount ?? "", item.time])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "opinny-account-activity.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="activity-panel enhanced-activity-panel" aria-labelledby="activity-title">
      <header className="activity-panel-head">
        <div><span className="eyebrow">Account ledger</span><h2 id="activity-title">Activity timeline</h2><p>Review trading, funding, rewards and market-resolution events.</p></div>
        <button className="secondary-button compact" type="button" disabled={!visible.length} onClick={exportCsv}><Download size={15} />Export CSV</button>
      </header>
      <div className="activity-toolbar">
        <div className="activity-filter-row" aria-label="Filter account activity">
          {filters.map((item) => <button className={filter === item.value ? "active" : ""} aria-pressed={filter === item.value} type="button" key={item.value} onClick={() => setFilter(item.value)}>{item.label}<span>{counts[item.value]}</span></button>)}
        </div>
        <label className="table-search activity-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search activity" aria-label="Search account activity" /></label>
      </div>
      {visible.length ? (
        <div className="activity-list">
          {visible.map((item) => {
            const Icon = icons[item.type];
            return <article key={item.id}><span className={`activity-icon ${item.type}`}><Icon size={17} /></span><div><strong>{item.title}</strong><span>{item.description}</span><small>{item.type} · {item.id}</small></div>{item.amount !== undefined ? <em className={item.amount >= 0 ? "positive" : "negative"}>{item.amount >= 0 ? "+" : "−"}{formatCurrency(Math.abs(item.amount))}</em> : null}<time>{item.time}</time></article>;
          })}
        </div>
      ) : <div className="table-empty large"><SearchX size={24} /><strong>No matching activity</strong><span>Try another event type or clear the search.</span><button type="button" onClick={() => { setFilter("all"); setQuery(""); }}>Reset filters</button></div>}
    </section>
  );
}
