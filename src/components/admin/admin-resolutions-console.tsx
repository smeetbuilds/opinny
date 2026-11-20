"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Clock3, ExternalLink, Search, ShieldAlert, X } from "lucide-react";
import type { ResolutionCase } from "@/core/contracts/domain";
import { dataAdapter } from "@/lib/data";
import { captureException } from "@/lib/observability";
import { useApp } from "@/components/app-provider";

type StatusFilter = "all" | ResolutionCase["status"];

export function AdminResolutionsConsole({ initialCases }: { initialCases: ResolutionCase[] }) {
  const { notify } = useApp();
  const [cases, setCases] = useState(initialCases);
  useEffect(() => {
    let mounted = true;
    void dataAdapter.getResolutionQueue().then((items) => { if (mounted) setCases(items); })
      .catch((error) => captureException(error, { operation: "hydrateAdminResolutions" }));
    return () => { mounted = false; };
  }, []);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<ResolutionCase | null>(null);
  const [chosenOutcome, setChosenOutcome] = useState("");
  const { marketCatalog } = useApp();
  const selectedMarket = selected?.marketId ? marketCatalog.find((item) => item.id === selected.marketId) : undefined;
  function inspect(item: ResolutionCase) {
    setChosenOutcome(item.proposedOutcome);
    setSelected(item);
  }
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && !pendingId && setSelected(null);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [pendingId, selected]);

  const counts = useMemo(() => ({
    all: cases.length,
    awaiting: cases.filter((item) => item.status === "awaiting").length,
    proposed: cases.filter((item) => item.status === "proposed").length,
    disputed: cases.filter((item) => item.status === "disputed").length,
    approved: cases.filter((item) => item.status === "approved").length
  }), [cases]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return cases.filter((item) => status === "all" || item.status === status).filter((item) => !normalized || [item.market, item.id, item.source, item.proposedOutcome].some((value) => value.toLowerCase().includes(normalized)));
  }, [cases, query, status]);

  async function approve(item: ResolutionCase, outcome = item.proposedOutcome) {
    setPendingId(item.id);
    try {
      const result = await dataAdapter.resolveMarket(item.id, outcome);
      if (result.status === "rejected") {
        notify("Resolution rejected", result.message, "system");
        return;
      }
      const nextCases = await dataAdapter.getResolutionQueue();
      setCases(nextCases);
      setSelected((current) => current ? nextCases.find((entry) => entry.id === current.id) ?? null : null);
      notify("Resolution approved", result.message, "market", "resolutionEvents");
    } catch (cause) {
      captureException(cause, { operation: "resolveMarket", caseId: item.id });
      notify("Resolution failed", "The connected integration did not approve the resolution.", "system");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      <div className="resolution-summary resolution-summary-enhanced">{(["awaiting", "proposed", "disputed", "approved"] as ResolutionCase["status"][]).map((value) => <button type="button" className={status === value ? "active" : ""} onClick={() => setStatus(status === value ? "all" : value)} key={value}><span>{value === "awaiting" ? "Awaiting proposal" : value}</span><strong>{counts[value]}</strong><small>{value === "disputed" ? "Requires evidence review" : value === "approved" ? "Completed cases" : "In resolution workflow"}</small></button>)}</div>
      <section className="admin-panel admin-console-panel resolution-console">
        <div className="admin-console-head"><div><span className="eyebrow">Settlement operations</span><h2>Resolution queue</h2><p>Validate source evidence, handle disputes and approve final outcomes.</p></div><span className="admin-queue-badge"><Clock3 size={15} />{counts.awaiting + counts.disputed} need attention</span></div>
        <div className="admin-table-toolbar admin-toolbar-rich"><label className="admin-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search market, case ID or source" aria-label="Search resolution cases" />{query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear resolution search"><X size={14} /></button> : null}</label><div className="panel-tabs" aria-label="Filter resolution status">{(["all", "awaiting", "proposed", "disputed", "approved"] as StatusFilter[]).map((value) => <button type="button" className={status === value ? "active" : ""} onClick={() => setStatus(value)} key={value}>{value}<span>{counts[value]}</span></button>)}</div></div>
        <div className="admin-results-line"><span><strong>{filtered.length}</strong> resolution cases</span>{query || status !== "all" ? <button type="button" className="text-button" onClick={() => { setQuery(""); setStatus("all"); }}>Reset filters</button> : null}</div>
        {filtered.length ? <div className="resolution-board resolution-board-enhanced">{filtered.map((item) => <article className={`resolution-card resolution-${item.status}`} key={item.id}><header><div><span className={`status-pill ${item.status}`}>{item.status}</span><small>{item.id} · {item.marketId ? "Closes" : "Ended"} {item.endDate}</small></div><button type="button" className="icon-button" aria-label={`Inspect resolution case ${item.id}`} onClick={() => inspect(item)}><ExternalLink size={17} /></button></header><h2>{item.market}</h2><div className="resolution-detail-grid"><div><span>Proposed outcome</span><strong>{item.proposedOutcome}</strong></div><div><span>Resolution source</span><strong>{item.source}</strong></div><div><span>Disputes</span><strong className={item.disputes ? "negative" : "positive"}>{item.disputes}</strong></div></div><footer>{item.status === "approved" ? <span className="resolution-complete"><Check size={15} />Approved</span> : item.status === "disputed" ? <button type="button" className="secondary-button compact" onClick={() => inspect(item)}><ShieldAlert size={15} />Review dispute</button> : <button type="button" className="primary-button compact" disabled={pendingId === item.id} onClick={() => item.marketId ? inspect(item) : void approve(item)}><Check size={15} />{pendingId === item.id ? "Approving…" : item.marketId ? "Choose result" : "Approve"}</button>}<button type="button" className="text-button" onClick={() => inspect(item)}>View evidence <ChevronRight size={13} /></button></footer></article>)}</div> : <div className="admin-empty-state"><Check size={22} /><h3>No cases in this view</h3><p>The selected workflow stage has no matching resolution cases.</p><button type="button" className="secondary-button compact" onClick={() => { setQuery(""); setStatus("all"); }}>Show all cases</button></div>}
      </section>

      {selected ? <div className="admin-modal-wrap"><button type="button" className="admin-modal-backdrop" disabled={Boolean(pendingId)} onClick={() => setSelected(null)} aria-label="Close evidence panel" /><aside className="admin-side-panel" role="dialog" aria-modal="true" aria-labelledby="evidence-title"><header><div><span className={`status-pill ${selected.status}`}>{selected.status}</span><h2 id="evidence-title">Resolution evidence</h2><p>{selected.id}</p></div><button type="button" className="icon-button" disabled={Boolean(pendingId)} onClick={() => setSelected(null)} aria-label="Close evidence panel"><X size={17} /></button></header><div className="admin-side-panel-body"><section><span>Market</span><strong>{selected.market}</strong></section><div className="resolution-evidence-grid"><section><span>Proposed outcome</span><strong>{selected.proposedOutcome}</strong></section><section><span>{selected.marketId ? "Market closes" : "Market ended"}</span><strong>{selected.endDate}</strong></section><section><span>Dispute count</span><strong className={selected.disputes ? "negative" : "positive"}>{selected.disputes}</strong></section></div>{selectedMarket && selected.status !== "approved" ? <section className="paper-resolution-choice"><label htmlFor="paper-winning-outcome">Winning outcome (paper scenario)</label><select id="paper-winning-outcome" value={chosenOutcome} onChange={(event) => setChosenOutcome(event.target.value)}>{selectedMarket.outcomes.map((outcome) => <option key={outcome.id} value={outcome.label}>{outcome.label}</option>)}</select><p>Local simulation only. Approving immediately closes trading, cancels remaining orders and enables winning-share redemption. No real-world result is verified.</p></section> : null}<section className="evidence-source-card"><span>Primary resolution source</span><strong>{selected.source}</strong><p>This record represents evidence supplied by the adapter. Production integrations should provide source URL, captured timestamp and immutable evidence hash.</p></section>{selected.status === "disputed" ? <div className="admin-warning-box"><ShieldAlert size={18} /><span><strong>Dispute review required</strong><p>{selected.disputes} challenge{selected.disputes === 1 ? "" : "s"} must be reviewed before settlement.</p></span></div> : null}</div><footer>{selected.status !== "approved" ? <button type="button" className="primary-button" disabled={pendingId === selected.id} onClick={() => void approve(selected, selectedMarket ? chosenOutcome : selected.proposedOutcome)}><Check size={16} />{pendingId === selected.id ? "Approving…" : `Approve ${selectedMarket ? chosenOutcome : selected.proposedOutcome}`}</button> : <span className="resolution-complete"><Check size={15} />This case is approved</span>}<button type="button" className="secondary-button" disabled={Boolean(pendingId)} onClick={() => setSelected(null)}>Close review</button></footer></aside></div> : null}
    </>
  );
}
