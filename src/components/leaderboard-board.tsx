"use client";

import Link from "next/link";
import { Award, Flame, Medal, Search, SearchX, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import type { LeaderboardEntry } from "@/core/contracts/domain";
import { formatCurrency } from "@/lib/format";

type Period = "weekly" | "monthly" | "all-time";
const periods: { value: Period; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "all-time", label: "All time" }
];

function periodProfit(entry: LeaderboardEntry, period: Period) {
  if (period === "weekly") return entry.weeklyProfit;
  if (period === "monthly") return entry.monthlyProfit;
  return entry.allTimeProfit;
}

export function LeaderboardBoard({ entries }: { entries: LeaderboardEntry[] }) {
  const [period, setPeriod] = useState<Period>("monthly");
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const categories = useMemo(() => ["All", ...Array.from(new Set(entries.flatMap((entry) => entry.categories))).sort()], [entries]);
  const ranked = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return entries
      .filter((entry) => category === "All" || entry.categories.includes(category))
      .filter((entry) => !normalized || `${entry.displayName} ${entry.handle} ${entry.categories.join(" ")}`.toLowerCase().includes(normalized))
      .sort((a, b) => periodProfit(b, period) - periodProfit(a, period));
  }, [category, entries, period, query]);

  return (
    <>
      <header className="page-hero leaderboard-hero enhanced-leaderboard-hero">
        <span className="eyebrow">Top forecasters</span><h1>Leaderboard</h1><p>Compare realised performance across timeframes and market categories.</p>
        <div className="leaderboard-control-surface"><div className="leaderboard-periods" aria-label="Leaderboard timeframe">{periods.map((item) => <button type="button" className={period === item.value ? "active" : ""} aria-pressed={period === item.value} key={item.value} onClick={() => setPeriod(item.value)}>{item.label}</button>)}</div><label className="table-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search trader" aria-label="Search leaderboard" /></label><label className="table-sort"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label></div>
      </header>

      {ranked.length ? <div className="podium-grid">{ranked.slice(0, 3).map((entry, index) => <article className={`podium-card place-${index + 1}`} key={entry.handle}><span className="podium-icon">{index === 0 ? <Trophy size={22} /> : index === 1 ? <Medal size={22} /> : <Award size={22} />}</span><span className="profile-avatar xl-avatar">{entry.initials}</span><Link href={`/profile/${entry.handle}`}><strong>{entry.displayName}</strong><small>@{entry.handle}</small></Link><em>{formatCurrency(periodProfit(entry, period))}</em><span>{periods.find((item) => item.value === period)?.label} profit</span><div><b>{formatCurrency(entry.volume, { compact: true })}<small>Volume</small></b><b>{entry.accuracy}%<small>Accuracy</small></b></div></article>)}</div> : null}

      <section className="data-panel leaderboard-table enhanced-leaderboard-table"><div className="table-title"><div><h2>Global ranking</h2><span>{ranked.length} traders · {periods.find((item) => item.value === period)?.label}{category !== "All" ? ` · ${category}` : ""}</span></div></div>{ranked.length ? <div className="responsive-table"><table><thead><tr><th>Rank</th><th>Trader</th><th>Profit</th><th>Volume</th><th>Accuracy</th><th>Winning streak</th></tr></thead><tbody>{ranked.map((entry, index) => <tr key={entry.handle}><td data-label="Rank"><strong>#{index + 1}</strong></td><td data-label="Trader"><Link className="trader-cell" href={`/profile/${entry.handle}`}><span className="profile-avatar">{entry.initials}</span><span><strong>{entry.displayName}</strong><small>@{entry.handle} · {entry.categories.slice(0, 2).join(" / ")}</small></span></Link></td><td data-label="Profit" className={periodProfit(entry, period) >= 0 ? "positive" : "negative"}>{periodProfit(entry, period) >= 0 ? "+" : ""}{formatCurrency(periodProfit(entry, period))}</td><td data-label="Volume">{formatCurrency(entry.volume, { compact: true })}</td><td data-label="Accuracy">{entry.accuracy}%</td><td data-label="Winning streak"><span className="streak"><Flame size={15} />{entry.streak}</span></td></tr>)}</tbody></table></div> : <div className="table-empty large"><SearchX size={24} /><strong>No matching traders</strong><span>Try another category or clear the search.</span><button type="button" onClick={() => { setCategory("All"); setQuery(""); }}>Reset filters</button></div>}</section>
    </>
  );
}
