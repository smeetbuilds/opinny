"use client";

import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Coins, Info, Search, SlidersHorizontal, Sparkles, Trophy, Wallet, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { RewardOpportunity } from "@/core/contracts/domain";
import { appConfig } from "@/lib/config";
import { useApp } from "./app-provider";

type RewardSort = "reward" | "competition" | "spread";

function tokenAmount(value: number) {
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${appConfig.collateral}`;
}

export function RewardsConsole({ initialRewards }: { initialRewards: RewardOpportunity[] }) {
  const { connected, setWalletOpen } = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [sort, setSort] = useState<RewardSort>("reward");
  const [selected, setSelected] = useState<RewardOpportunity | null>(null);

  const categories = useMemo(() => ["All", ...Array.from(new Set(initialRewards.map((reward) => reward.category))).sort()], [initialRewards]);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return [...initialRewards]
      .filter((reward) => category === "All" || reward.category === category)
      .filter((reward) => !eligibleOnly || reward.eligible)
      .filter((reward) => !normalized || `${reward.marketQuestion} ${reward.category}`.toLowerCase().includes(normalized))
      .sort((a, b) => {
        if (sort === "competition") return a.competitionPercent - b.competitionPercent;
        if (sort === "spread") return a.maxSpreadCents - b.maxSpreadCents;
        return b.dailyReward - a.dailyReward;
      });
  }, [category, eligibleOnly, initialRewards, query, sort]);

  const totalDaily = initialRewards.reduce((sum, reward) => sum + reward.dailyReward, 0);
  const earned = initialRewards.reduce((sum, reward) => sum + reward.earned, 0);
  const qualifying = initialRewards.filter((reward) => reward.eligible).length;

  useEffect(() => {
    if (!selected) return;
    const previous = document.body.style.overflow;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setSelected(null);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", close);
    };
  }, [selected]);

  return (
    <>
      <section className="rewards-hero" aria-labelledby="rewards-title">
        <div>
          <span className="eyebrow">Liquidity incentives</span>
          <h1 id="rewards-title">Rewards for competitive markets</h1>
          <p>Explore incentive programmes supplied by the connected integration. Competitive limit orders can qualify when they stay within the configured spread and minimum-size rules.</p>
        </div>
        {!connected ? <button className="primary-button" type="button" onClick={() => setWalletOpen(true)}><Wallet size={16} />Connect wallet</button> : <span className="rewards-connected"><CheckCircle2 size={16} />Wallet connected</span>}
      </section>

      <div className="rewards-summary-grid">
        <article><span><Coins size={17} />Daily programme</span><strong>{tokenAmount(totalDaily)}</strong><small>Across currently listed opportunities</small></article>
        <article><span><Trophy size={17} />Qualifying markets</span><strong>{qualifying}</strong><small>Based on integration-supplied rules</small></article>
        <article><span><Sparkles size={17} />Your earnings</span><strong>{connected ? tokenAmount(earned) : "—"}</strong><small>{connected ? "Reference account estimate" : "Connect to view account rewards"}</small></article>
      </div>

      <section className="rewards-panel" aria-labelledby="reward-opportunities-title">
        <div className="rewards-panel-head">
          <div><span className="eyebrow">Opportunities</span><h2 id="reward-opportunities-title">Active reward markets</h2></div>
          <span className="rewards-count">{visible.length} shown</span>
        </div>

        <div className="rewards-toolbar">
          <label className="market-search-field rewards-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search reward markets" aria-label="Search reward markets" />{query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear reward search"><X size={14} /></button> : null}</label>
          <label className="select-control"><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Reward category">{categories.map((item) => <option value={item} key={item}>{item}</option>)}</select></label>
          <label className="toggle-control"><input type="checkbox" checked={eligibleOnly} onChange={(event) => setEligibleOnly(event.target.checked)} /><span />Qualifying only</label>
          <label className="select-control"><SlidersHorizontal size={15} /><select value={sort} onChange={(event) => setSort(event.target.value as RewardSort)} aria-label="Sort rewards"><option value="reward">Highest reward</option><option value="competition">Lowest competition</option><option value="spread">Tightest spread</option></select></label>
        </div>

        {visible.length ? (
          <div className="responsive-table rewards-table">
            <table>
              <thead><tr><th>Market</th><th>Rules</th><th>Reward</th><th>Competition</th><th>Earnings</th><th>Prices</th><th>Status</th><th /></tr></thead>
              <tbody>{visible.map((reward) => (
                <tr key={reward.id}>
                  <td className="wide-cell" data-label="Market"><Link href={`/market/${reward.marketSlug}`}>{reward.marketQuestion}<small>{reward.category}</small></Link></td>
                  <td data-label="Rules"><button className="reward-rule-button" type="button" onClick={() => setSelected(reward)}><Info size={13} />±{reward.maxSpreadCents}¢ · {reward.minimumShares} min</button></td>
                  <td data-label="Reward"><strong>{tokenAmount(reward.dailyReward)}</strong><small>/ day</small></td>
                  <td data-label="Competition"><div className="competition-meter"><span>{reward.competitionPercent}%</span><i><b style={{ width: `${reward.competitionPercent}%` }} /></i></div></td>
                  <td data-label="Earnings">{connected ? tokenAmount(reward.earned) : "—"}</td>
                  <td data-label="Prices"><div className="reward-prices">{reward.outcomePrices.map((outcome) => <span key={outcome.label}><small>{outcome.label}</small><strong>{Math.round(outcome.price * 100)}¢</strong></span>)}</div></td>
                  <td data-label="Status"><span className={reward.eligible ? "reward-status eligible" : "reward-status watch"}>{reward.eligible ? "Qualifying" : "Watch"}</span></td>
                  <td className="reward-row-action"><Link href={`/market/${reward.marketSlug}`}>Market <ArrowUpRight size={13} /></Link></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <div className="table-empty large"><Search size={24} /><strong>No reward markets match</strong><span>Change the category, eligibility filter or search term.</span><button type="button" onClick={() => { setQuery(""); setCategory("All"); setEligibleOnly(false); }}>Reset filters</button></div>}
      </section>

      <section className="rewards-explainer">
        <Info size={18} />
        <div><strong>How qualification works</strong><p>Opinny only presents the programme state supplied by an adapter. A production integration must calculate eligibility, competition, accrual and final reward settlement. The browser does not award or custody funds.</p></div>
      </section>

      {selected ? (
        <div className="overlay reward-rules-overlay" onMouseDown={() => setSelected(null)}>
          <section className="reward-rules-dialog" role="dialog" aria-modal="true" aria-labelledby="reward-rules-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <header><div><span className="eyebrow">Reward rules</span><h2 id="reward-rules-title">{selected.marketQuestion}</h2><p>Keep qualifying limit orders competitive to participate in this incentive programme.</p></div><button className="icon-button" type="button" aria-label="Close reward rules" onClick={() => setSelected(null)}><X size={17} /></button></header>
            <div className="reward-rule-grid">
              <span><small>Maximum spread</small><strong>±{selected.maxSpreadCents}¢</strong></span>
              <span><small>Minimum size</small><strong>{selected.minimumShares} shares</strong></span>
              <span><small>Daily pool</small><strong>{tokenAmount(selected.dailyReward)}</strong></span>
              <span><small>Competition</small><strong>{selected.competitionPercent}%</strong></span>
            </div>
            <p className="reward-rule-note">Displayed eligibility is informational. The connected backend or protocol remains authoritative for snapshots, scoring, exclusions and settlement.</p>
            <footer><button className="secondary-button" type="button" onClick={() => setSelected(null)}>Close</button><Link className="primary-button" href={`/market/${selected.marketSlug}`}>Open market <ArrowUpRight size={14} /></Link></footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
