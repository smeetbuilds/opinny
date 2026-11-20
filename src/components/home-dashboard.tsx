"use client";

import Link from "next/link";
import { ArrowUpRight, BookOpenText, ChartNoAxesCombined, Layers3 } from "lucide-react";
import type { LeaderboardEntry, Market } from "@/core/contracts/domain";
import { useApp } from "./app-provider";
import { MarketGrid } from "./market-grid";
import { formatCurrency, formatNumber } from "@/lib/format";
import { marketHref } from "@/lib/market-href";

/** Illustrate the actual paper market product, not a stock or whiteboard mockup. */
export function HomeDashboard({ initialMarkets, leaderboard }: { initialMarkets: Market[]; leaderboard: LeaderboardEntry[] }) {
  const { marketCatalog } = useApp();
  const markets = (marketCatalog.length ? marketCatalog : initialMarkets).filter((market) => market.status !== "draft");
  const openMarkets = markets.filter((market) => market.status === "open");
  const featured = openMarkets.find((market) => market.featured) ?? openMarkets[0];
  const featuredLeader = featured?.outcomes.reduce((best, next) => next.probability > best.probability ? next : best, featured.outcomes[0]);
  const trending = [...openMarkets].sort((a, b) => b.volume24h - a.volume24h).slice(0, 5);
  const mostActive = trending[0];
  const deepest = [...openMarkets].sort((a, b) => b.liquidity - a.liquidity)[0];
  const endingSoon = [...openMarkets].sort((a, b) => +new Date(a.endDate) - +new Date(b.endDate))[0];
  const totalVolume = markets.reduce((sum, market) => sum + market.volume, 0);
  const totalTraders = markets.reduce((sum, market) => sum + market.traders, 0);
  const topTrader = [...leaderboard].sort((a, b) => b.monthlyProfit - a.monthlyProfit)[0];
  const signals = [
    mostActive ? { label: "Most sample activity", market: mostActive, value: formatCurrency(mostActive.volume24h, { compact: true }) } : null,
    deepest ? { label: "Deepest simulated book", market: deepest, value: formatCurrency(deepest.liquidity, { compact: true }) } : null,
    endingSoon ? { label: "Earliest scheduled close", market: endingSoon, value: endingSoon.category } : null
  ].filter((signal): signal is NonNullable<typeof signal> => Boolean(signal));

  return (
    <div className="home-page page-container opinny-desk-home">
      <section className="hero-grid desk-hero" aria-labelledby="opinny-home-headline">
        <div className="hero-copy">
          <span className="hero-kicker"><span className="hero-kicker-mark" aria-hidden="true" />THE PAPER PREDICTION MARKET</span>
          <h1 id="opinny-home-headline">Your view of tomorrow,<br /><em>tested today.</em></h1>
          <p>From politics to technology, discover the questions that matter, explore the odds, and practice trading without risking real funds.</p>
          <div className="hero-actions">
            <Link className="primary-button" href="/markets">Explore markets <ArrowUpRight size={17} /></Link>
            <Link className="secondary-button" href="/portfolio">Your paper portfolio</Link>
          </div>
        </div>

        <div className="market-board-frame" aria-label="Featured simulated prediction market">
          <div className="market-board-topline">
            <span><span className="board-topline-dot" aria-hidden="true" /> OPINNY / MARKET BOARD</span>
            <span>Sample data · no live feed</span>
          </div>
          <div className="featured-market-panel">
            <div className="featured-market-head"><span>MARKET IN FOCUS</span><span>{featured?.category ?? "Event markets"}</span></div>
            {featured && featuredLeader ? (
              <>
                <h2><Link href={marketHref(featured.slug, featured.id)}>{featured.question}</Link></h2>
                <div className="featured-market-quote">
                  <span>Market-leading outcome</span>
                  <strong>{featuredLeader.label}</strong>
                  <b>{featuredLeader.probability.toFixed(1)}<small>%</small></b>
                </div>
                <div className="featured-market-rows">
                  {featured.outcomes.slice(0, 4).map((outcome) => (
                    <Link href={marketHref(featured.slug, featured.id, outcome.id)} key={outcome.id}>
                      <span>{outcome.label}</span>
                      <i aria-hidden="true"><b style={{ width: `${outcome.probability}%` }} /></i>
                      <strong>{outcome.probability.toFixed(1)}%</strong>
                    </Link>
                  ))}
                </div>
                <div className="featured-board-foot">
                  <span>Prices are simulated, not a recommendation.</span>
                  <Link className="featured-market-action" href={marketHref(featured.slug, featured.id)}>Explore this market <ArrowUpRight size={16} /></Link>
                </div>
              </>
            ) : <p className="featured-market-empty">There are no open scenarios yet. Explore the market archive for resolved examples.</p>}
          </div>
          <div className="board-context-note">
            <span>01 / UNDERSTAND</span>
            <strong>Questions into probabilities.</strong>
            <p>Compare possible outcomes on an actual paper-market screen.</p>
          </div>
        </div>

        <dl className="hero-proof" aria-label="Sample platform data">
          <div><dt>Sample trading volume</dt><dd>{formatCurrency(totalVolume, { compact: true })}</dd></div>
          <div><dt>Open paper markets</dt><dd>{openMarkets.length}</dd></div>
          <div><dt>Sample participants</dt><dd>{formatNumber(totalTraders, true)}</dd></div>
        </dl>
      </section>

      <section className="home-workflow" aria-labelledby="home-workflow-title">
        <div className="workflow-intro">
          <span className="eyebrow">LEARN BY DOING</span>
          <h2 id="home-workflow-title">A clearer way to explore uncertainty.</h2>
          <p>No deposits. No real positions. Just the full journey of a market, from your first view to the final result.</p>
        </div>
        <div className="workflow-grid">
          <Link href="/markets" className="workflow-card workflow-card-rose">
            <span className="workflow-card-icon"><BookOpenText size={24} /></span>
            <span className="workflow-card-index">01 / DISCOVER</span>
            <strong>Find a question worth exploring.</strong>
            <span className="workflow-card-copy">Browse markets by topic, review how outcomes are defined, and compare probabilities.</span>
            <span className="workflow-card-link">Browse the questions <ArrowUpRight size={18} /></span>
          </Link>
          <Link href="/markets" className="workflow-card workflow-card-teal">
            <span className="workflow-card-icon"><ChartNoAxesCombined size={24} /></span>
            <span className="workflow-card-index">02 / PRACTICE</span>
            <strong>See what your conviction is worth.</strong>
            <span className="workflow-card-copy">Test paper market and limit orders, review the fee, and understand your potential payout.</span>
            <span className="workflow-card-link">Open the trading desk <ArrowUpRight size={18} /></span>
          </Link>
          <Link href="/portfolio" className="workflow-card workflow-card-coral">
            <span className="workflow-card-icon"><Layers3 size={24} /></span>
            <span className="workflow-card-index">03 / REFLECT</span>
            <strong>Follow the position, not the hype.</strong>
            <span className="workflow-card-copy">Track simulated holdings, see changes and claim a paper payout when a market resolves.</span>
            <span className="workflow-card-link">View your portfolio <ArrowUpRight size={18} /></span>
          </Link>
        </div>
      </section>

      {signals.length ? <section className="signal-strip desk-signal-strip" aria-label="Paper market pulse">
        {signals.map(({ label, market, value }) => (
          <div key={label}><span>{label}</span><Link href={marketHref(market.slug, market.id)}>{market.shortQuestion}</Link><strong>{value}</strong></div>
        ))}
      </section> : null}

      <div className="home-content-grid">
        <MarketGrid initialMarkets={markets} heading="Explore the markets" />
        <aside className="trending-sidebar desk-sidebar">
          <div className="sidebar-head"><div><span className="eyebrow">PAPER ACTIVITY</span><h2>Market watch</h2></div><Link href="/markets">All markets</Link></div>
          <div className="trend-list">{trending.map((market, index) => (
            <Link href={marketHref(market.slug, market.id)} key={market.id}>
              <span className="trend-rank">{String(index + 1).padStart(2, "0")}</span>
              <span className="trend-copy"><strong>{market.shortQuestion}</strong><small>{formatCurrency(market.volume24h, { compact: true })} · sample volume</small></span>
              <em>{market.outcomes[0].probability.toFixed(1)}%</em>
            </Link>
          ))}</div>
          {topTrader ? <div className="leaderboard-teaser">
            <span className="eyebrow">SAMPLE LEADERBOARD</span>
            <div><span className="profile-avatar">{topTrader.initials}</span><span><strong>{topTrader.displayName}</strong><small>{formatCurrency(topTrader.monthlyProfit)} · simulated monthly P/L</small></span></div>
            <Link href="/leaderboard">Explore rankings</Link>
          </div> : null}
        </aside>
      </div>

      <section className="home-cta" aria-labelledby="home-cta-title">
        <span>MAKE A CALL. LEARN FROM THE OUTCOME.</span>
        <h2 id="home-cta-title">Every good forecast starts with a question.</h2>
        <p>Explore the markets, build a simulated position, and see how your view plays out.</p>
        <Link className="home-cta-button" href="/markets">Start exploring <ArrowUpRight size={17} /></Link>
      </section>
    </div>
  );
}
