"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Check, Copy, MoreHorizontal, Pause, Plus, Search, X } from "lucide-react";
import type { AdminMarketInput, Market, MarketStatus } from "@/core/contracts/domain";
import { dataAdapter } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/format";
import { useApp } from "@/components/app-provider";

type StatusFilter = "all" | MarketStatus;
type SortMode = "volume" | "ending" | "probability";

const emptyForm: AdminMarketInput = {
  question: "",
  category: "Politics",
  kind: "binary",
  outcomes: ["Yes", "No"],
  endDate: "",
  resolutionSource: "",
  resolutionRules: ""
};

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function AdminMarketsConsole({ initialMarkets }: { initialMarkets: Market[] }) {
  const { notify } = useApp();
  const [markets, setMarkets] = useState(initialMarkets);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortMode>("volume");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<AdminMarketInput>(emptyForm);

  useEffect(() => {
    if (!createOpen) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && setCreateOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [createOpen]);

  const counts = useMemo(() => ({
    all: markets.length,
    open: markets.filter((market) => market.status === "open").length,
    draft: markets.filter((market) => market.status === "draft").length,
    paused: markets.filter((market) => market.status === "paused").length,
    resolved: markets.filter((market) => market.status === "resolved").length
  }), [markets]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return markets
      .filter((market) => status === "all" || market.status === status)
      .filter((market) => !normalized || [market.question, market.shortQuestion, market.category, market.id, ...market.tags].some((value) => value.toLowerCase().includes(normalized)))
      .sort((a, b) => sort === "ending"
        ? +new Date(a.endDate) - +new Date(b.endDate)
        : sort === "probability"
          ? b.outcomes[0].probability - a.outcomes[0].probability
          : b.volume - a.volume);
  }, [markets, query, status, sort]);

  async function copyId(id: string) {
    await navigator.clipboard.writeText(id);
    notify("Market ID copied", id);
    setMenuId(null);
  }

  function toggleMarket(market: Market) {
    const nextStatus: MarketStatus = market.status === "paused" ? "open" : "paused";
    setMarkets((current) => current.map((item) => item.id === market.id ? { ...item, status: nextStatus } : item));
    notify(nextStatus === "paused" ? "Market paused" : "Market reopened", market.shortQuestion);
    setMenuId(null);
  }

  async function createMarket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.question.trim() || !form.endDate || !form.resolutionSource.trim() || !form.resolutionRules.trim()) {
      notify("Complete the required fields", "Question, close date, source and rules are required.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await dataAdapter.createMarket(form);
      const id = result.id || `market-${Date.now()}`;
      const nextMarket: Market = {
        id,
        slug: `${slugify(form.question)}-${Date.now().toString().slice(-5)}`,
        question: form.question.trim(),
        shortQuestion: form.question.trim(),
        description: form.resolutionRules.trim(),
        category: form.category,
        tags: [form.category],
        kind: form.kind,
        status: "draft",
        imageTone: "tone-green",
        icon: "◎",
        outcomes: form.outcomes.filter(Boolean).map((label, index, values) => ({
          id: `${id}-outcome-${index + 1}`,
          label,
          probability: Math.round(100 / Math.max(values.length, 1)),
          change24h: 0,
          volume24h: 0
        })),
        volume: 0,
        volume24h: 0,
        liquidity: 0,
        traders: 0,
        endDate: new Date(form.endDate).toISOString(),
        createdAt: new Date().toISOString(),
        resolutionSource: form.resolutionSource.trim(),
        resolutionRules: form.resolutionRules.trim(),
        chart: [50, 50, 50, 50]
      };
      setMarkets((current) => [nextMarket, ...current]);
      setForm(emptyForm);
      setCreateOpen(false);
      notify("Draft market created", result.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="admin-page-kpis" aria-label="Market operational summary">
        <article><span>Total markets</span><strong>{counts.all}</strong><small>{counts.open} currently trading</small></article>
        <article><span>Open liquidity</span><strong>{formatCurrency(markets.filter((market) => market.status === "open").reduce((sum, market) => sum + market.liquidity, 0), { compact: true })}</strong><small>Across active books</small></article>
        <article><span>Needs attention</span><strong>{counts.draft + counts.paused}</strong><small>{counts.draft} drafts · {counts.paused} paused</small></article>
      </div>

      <section className="admin-panel admin-console-panel">
        <div className="admin-console-head">
          <div><span className="eyebrow">Market operations</span><h2>Market inventory</h2><p>Search, inspect and manage every market from one workspace.</p></div>
          <button className="primary-button compact" type="button" onClick={() => setCreateOpen(true)}><Plus size={16} />Create market</button>
        </div>
        <div className="admin-table-toolbar admin-toolbar-rich">
          <label className="admin-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search question, ID or category" aria-label="Search markets" />{query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear market search"><X size={14} /></button> : null}</label>
          <div className="admin-filter-row">
            <div className="panel-tabs" aria-label="Filter markets by status">
              {(["all", "open", "draft", "paused", "resolved"] as StatusFilter[]).map((value) => <button className={status === value ? "active" : ""} type="button" key={value} onClick={() => setStatus(value)}>{value}<span>{counts[value]}</span></button>)}
            </div>
            <label className="admin-select-control"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="volume">Highest volume</option><option value="ending">Ending soon</option><option value="probability">Highest probability</option></select></label>
          </div>
        </div>
        <div className="admin-results-line"><span><strong>{filtered.length}</strong> of {markets.length} markets</span>{query || status !== "all" ? <button type="button" className="text-button" onClick={() => { setQuery(""); setStatus("all"); }}>Reset filters</button> : null}</div>
        {filtered.length ? <div className="responsive-table admin-responsive-table"><table><thead><tr><th>Market</th><th>Category</th><th>Probability</th><th>Volume</th><th>Liquidity</th><th>End date</th><th>Status</th><th aria-label="Actions" /></tr></thead><tbody>{filtered.map((market) => <tr key={market.id}><td data-label="Market" className="wide-cell"><div className="admin-market-cell"><span className={`market-avatar small ${market.imageTone}`}>{market.icon}</span><span><strong>{market.shortQuestion}</strong><small>{market.id}</small></span></div></td><td data-label="Category">{market.category}</td><td data-label="Probability"><strong>{market.outcomes[0].probability}%</strong><small className={market.outcomes[0].change24h >= 0 ? "positive" : "negative"}>{market.outcomes[0].change24h >= 0 ? "+" : ""}{market.outcomes[0].change24h.toFixed(1)} today</small></td><td data-label="Volume">{formatCurrency(market.volume, { compact: true })}</td><td data-label="Liquidity">{formatCurrency(market.liquidity, { compact: true })}</td><td data-label="End date">{formatDate(market.endDate)}</td><td data-label="Status"><span className={`status-pill ${market.status}`}>{market.status}</span></td><td className="admin-row-actions"><div className="admin-action-menu-wrap"><button type="button" className="icon-button" aria-expanded={menuId === market.id} aria-label={`Open market actions for ${market.shortQuestion}`} onClick={() => setMenuId(menuId === market.id ? null : market.id)}><MoreHorizontal size={17} /></button>{menuId === market.id ? <div className="admin-action-menu"><Link href={`/market/${market.slug}`}><ArrowUpRight size={14} />View public page</Link><button type="button" onClick={() => copyId(market.id)}><Copy size={14} />Copy market ID</button>{market.status !== "resolved" && market.status !== "draft" ? <button type="button" onClick={() => toggleMarket(market)}>{market.status === "paused" ? <Check size={14} /> : <Pause size={14} />}{market.status === "paused" ? "Reopen market" : "Pause market"}</button> : null}</div> : null}</div></td></tr>)}</tbody></table></div> : <div className="admin-empty-state"><Search size={22} /><h3>No markets match</h3><p>Try a broader search or reset the active status filter.</p><button type="button" className="secondary-button compact" onClick={() => { setQuery(""); setStatus("all"); }}>Reset filters</button></div>}
      </section>

      {createOpen ? <div className="admin-modal-wrap" role="presentation"><button className="admin-modal-backdrop" type="button" onClick={() => setCreateOpen(false)} aria-label="Close create market dialog" /><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="create-market-title"><header><div><span className="eyebrow">New market</span><h2 id="create-market-title">Create a market draft</h2><p>Define the trading question and unambiguous resolution criteria.</p></div><button type="button" className="icon-button" onClick={() => setCreateOpen(false)} aria-label="Close dialog"><X size={17} /></button></header><form onSubmit={createMarket} className="admin-form"><label className="span-two"><span>Market question</span><textarea autoFocus value={form.question} onChange={(event) => setForm({ ...form, question: event.target.value })} placeholder="Will…?" maxLength={180} /><small>{form.question.length}/180</small></label><label><span>Category</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{["Politics", "Crypto", "Sports", "Technology", "Economy", "Culture", "Science"].map((category) => <option key={category}>{category}</option>)}</select></label><label><span>Close date</span><input type="datetime-local" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></label><label><span>Outcome one</span><input value={form.outcomes[0] ?? ""} onChange={(event) => setForm({ ...form, outcomes: [event.target.value, form.outcomes[1] ?? ""] })} /></label><label><span>Outcome two</span><input value={form.outcomes[1] ?? ""} onChange={(event) => setForm({ ...form, outcomes: [form.outcomes[0] ?? "", event.target.value] })} /></label><label className="span-two"><span>Resolution source</span><input value={form.resolutionSource} onChange={(event) => setForm({ ...form, resolutionSource: event.target.value })} placeholder="Official result, filing or public dataset" /></label><label className="span-two"><span>Resolution rules</span><textarea value={form.resolutionRules} onChange={(event) => setForm({ ...form, resolutionRules: event.target.value })} placeholder="Explain exactly how and when this market resolves." /></label><footer className="span-two"><button type="button" className="secondary-button compact" onClick={() => setCreateOpen(false)}>Cancel</button><button type="submit" className="primary-button compact" disabled={submitting}>{submitting ? "Creating…" : "Create draft"}</button></footer></form></section></div> : null}
    </>
  );
}
