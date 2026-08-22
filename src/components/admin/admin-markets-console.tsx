"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Check, Copy, MoreHorizontal, Pause, Plus, Search, Trash2, X } from "lucide-react";
import type { AdminMarketInput, Market, MarketKind, MarketStatus } from "@/core/contracts/domain";
import { dataAdapter } from "@/lib/data";
import { formatCurrency, formatDate } from "@/lib/format";
import { captureException } from "@/lib/observability";
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

export function AdminMarketsConsole({ initialMarkets }: { initialMarkets: Market[] }) {
  const { notify } = useApp();
  const [markets, setMarkets] = useState(initialMarkets);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortMode>("volume");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingMarketId, setPendingMarketId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminMarketInput>(emptyForm);

  useEffect(() => {
    if (!createOpen) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && !submitting && setCreateOpen(false);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [createOpen, submitting]);

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
          ? Math.max(...b.outcomes.map((outcome) => outcome.probability)) - Math.max(...a.outcomes.map((outcome) => outcome.probability))
          : b.volume - a.volume);
  }, [markets, query, status, sort]);

  async function copyId(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      notify("Market ID copied", id);
    } catch {
      notify("Copy failed", "The browser did not allow clipboard access.");
    }
    setMenuId(null);
  }

  async function toggleMarket(market: Market) {
    const nextStatus: MarketStatus = market.status === "paused" ? "open" : "paused";
    setPendingMarketId(market.id);
    try {
      const result = await dataAdapter.updateMarketStatus(market.id, nextStatus);
      if (result.status === "rejected") {
        notify("Market update rejected", result.message, "system");
        return;
      }
      setMarkets(await dataAdapter.listMarkets());
      notify(nextStatus === "paused" ? "Market paused" : "Market reopened", result.message);
      setMenuId(null);
    } catch (cause) {
      captureException(cause, { operation: "updateMarketStatus", marketId: market.id });
      notify("Market update failed", "The connected integration did not complete the status change.", "system");
    } finally {
      setPendingMarketId(null);
    }
  }

  function updateKind(kind: MarketKind) {
    setForm((current) => ({
      ...current,
      kind,
      outcomes: kind === "binary" ? [current.outcomes[0] || "Yes", current.outcomes[1] || "No"] : current.outcomes.length >= 2 ? current.outcomes : ["Outcome 1", "Outcome 2"]
    }));
  }

  function updateOutcome(index: number, value: string) {
    setForm((current) => ({ ...current, outcomes: current.outcomes.map((outcome, outcomeIndex) => outcomeIndex === index ? value : outcome) }));
  }

  async function createMarket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const outcomes = form.outcomes.map((outcome) => outcome.trim()).filter(Boolean);
    const duplicateOutcomes = new Set(outcomes.map((outcome) => outcome.toLowerCase())).size !== outcomes.length;
    if (!form.question.trim() || !form.endDate || !form.resolutionSource.trim() || !form.resolutionRules.trim()) {
      notify("Complete the required fields", "Question, close date, source and rules are required.");
      return;
    }
    if (outcomes.length < 2 || duplicateOutcomes || (form.kind === "binary" && outcomes.length !== 2)) {
      notify("Review market outcomes", form.kind === "binary" ? "Binary markets require exactly two unique outcomes." : "Multi-outcome markets require at least two unique outcomes.");
      return;
    }
    if (!Number.isFinite(new Date(form.endDate).getTime())) {
      notify("Review close date", "Enter a valid market close date.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await dataAdapter.createMarket({ ...form, outcomes });
      if (result.status === "rejected") {
        notify("Market creation rejected", result.message, "system");
        return;
      }
      setMarkets(await dataAdapter.listMarkets());
      setForm(emptyForm);
      setCreateOpen(false);
      notify("Draft market created", result.message);
    } catch (cause) {
      captureException(cause, { operation: "createMarket" });
      notify("Market creation failed", "The connected integration did not create the draft.", "system");
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
        {filtered.length ? <div className="responsive-table admin-responsive-table"><table><thead><tr><th>Market</th><th>Category</th><th>Probability</th><th>Volume</th><th>Liquidity</th><th>End date</th><th>Status</th><th aria-label="Actions" /></tr></thead><tbody>{filtered.map((market) => {
          const leader = market.outcomes.reduce((best, outcome) => outcome.probability > best.probability ? outcome : best, market.outcomes[0]);
          return <tr key={market.id}><td data-label="Market" className="wide-cell"><div className="admin-market-cell"><span className={`market-avatar small ${market.imageTone}`}>{market.icon}</span><span><strong>{market.shortQuestion}</strong><small>{market.id}</small></span></div></td><td data-label="Category">{market.category}</td><td data-label="Probability"><strong>{leader.probability}%</strong><small className={leader.change24h >= 0 ? "positive" : "negative"}>{leader.change24h >= 0 ? "+" : ""}{leader.change24h.toFixed(1)} today</small></td><td data-label="Volume">{formatCurrency(market.volume, { compact: true })}</td><td data-label="Liquidity">{formatCurrency(market.liquidity, { compact: true })}</td><td data-label="End date">{formatDate(market.endDate)}</td><td data-label="Status"><span className={`status-pill ${market.status}`}>{market.status}</span></td><td className="admin-row-actions"><div className="admin-action-menu-wrap"><button type="button" className="icon-button" aria-expanded={menuId === market.id} aria-label={`Open market actions for ${market.shortQuestion}`} onClick={() => setMenuId(menuId === market.id ? null : market.id)}><MoreHorizontal size={17} /></button>{menuId === market.id ? <div className="admin-action-menu"><Link href={`/market/${market.slug}`}><ArrowUpRight size={14} />View public page</Link><button type="button" onClick={() => void copyId(market.id)}><Copy size={14} />Copy market ID</button>{market.status !== "resolved" && market.status !== "draft" ? <button type="button" disabled={pendingMarketId === market.id} onClick={() => void toggleMarket(market)}>{market.status === "paused" ? <Check size={14} /> : <Pause size={14} />}{pendingMarketId === market.id ? "Updating…" : market.status === "paused" ? "Reopen market" : "Pause market"}</button> : null}</div> : null}</div></td></tr>;
        })}</tbody></table></div> : <div className="admin-empty-state"><Search size={22} /><h3>No markets match</h3><p>Try a broader search or reset the active status filter.</p><button type="button" className="secondary-button compact" onClick={() => { setQuery(""); setStatus("all"); }}>Reset filters</button></div>}
      </section>

      {createOpen ? <div className="admin-modal-wrap" role="presentation"><button className="admin-modal-backdrop" type="button" disabled={submitting} onClick={() => setCreateOpen(false)} aria-label="Close create market dialog" /><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="create-market-title"><header><div><span className="eyebrow">New market</span><h2 id="create-market-title">Create a market draft</h2><p>Define the trading question and unambiguous resolution criteria.</p></div><button type="button" className="icon-button" disabled={submitting} onClick={() => setCreateOpen(false)} aria-label="Close dialog"><X size={17} /></button></header><form onSubmit={(event) => void createMarket(event)} className="admin-form"><label className="span-two"><span>Market question</span><textarea autoFocus value={form.question} onChange={(event) => setForm({ ...form, question: event.target.value })} placeholder="Will…?" maxLength={180} /><small>{form.question.length}/180</small></label><label><span>Category</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{["Politics", "Crypto", "Sports", "Technology", "Economy", "Culture", "Science"].map((category) => <option key={category}>{category}</option>)}</select></label><label><span>Market type</span><select value={form.kind} onChange={(event) => updateKind(event.target.value as MarketKind)}><option value="binary">Binary</option><option value="multi">Multi-outcome</option></select></label><label className="span-two"><span>Close date</span><input type="datetime-local" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></label>{form.outcomes.map((outcome, index) => <label key={index}><span>{form.kind === "binary" ? `Outcome ${index + 1}` : `Outcome ${index + 1}`}</span><div className="admin-outcome-input"><input value={outcome} onChange={(event) => updateOutcome(index, event.target.value)} />{form.kind === "multi" && form.outcomes.length > 2 ? <button type="button" className="icon-button" aria-label={`Remove outcome ${index + 1}`} onClick={() => setForm((current) => ({ ...current, outcomes: current.outcomes.filter((_, outcomeIndex) => outcomeIndex !== index) }))}><Trash2 size={14} /></button> : null}</div></label>)}{form.kind === "multi" ? <div className="span-two"><button type="button" className="secondary-button compact" onClick={() => setForm((current) => ({ ...current, outcomes: [...current.outcomes, `Outcome ${current.outcomes.length + 1}`] }))}><Plus size={14} />Add outcome</button></div> : null}<label className="span-two"><span>Resolution source</span><input value={form.resolutionSource} onChange={(event) => setForm({ ...form, resolutionSource: event.target.value })} placeholder="Official result, filing or public dataset" /></label><label className="span-two"><span>Resolution rules</span><textarea value={form.resolutionRules} onChange={(event) => setForm({ ...form, resolutionRules: event.target.value })} placeholder="Explain exactly how and when this market resolves." /></label><footer className="span-two"><button type="button" className="secondary-button compact" disabled={submitting} onClick={() => setCreateOpen(false)}>Cancel</button><button type="submit" className="primary-button compact" disabled={submitting}>{submitting ? "Creating…" : "Create draft"}</button></footer></form></section></div> : null}
    </>
  );
}
