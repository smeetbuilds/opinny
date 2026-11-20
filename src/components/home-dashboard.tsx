"use client";

import Link from "next/link";
import type { LeaderboardEntry, Market } from "@/core/contracts/domain";
import { useApp } from "./app-provider";
import { MarketGrid } from "./market-grid";
import { formatCurrency, formatNumber } from "@/lib/format";
import { marketHref } from "@/lib/market-href";

/** An information-first paper exchange home rather than a marketing card stack. */
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
      <section className="hero-grid desk-hero">
        <div className="hero-copy">
          <span className="hero-kicker">OPINNY / PAPER MARKET DESK</span>
          <h1>Explore the odds.<br /><em>Test your view.</em></h1>
          <p>Find an event, compare outcome prices and practice orders with simulated USDC. No real money, no live market feed.</p>
          <div className="hero-actions">
            <Link className="primary-button" href="/markets">Browse markets</Link>
            <Link className="secondary-button" href="/portfolio">Your paper portfolio</Link>
          </div>
          <dl className="hero-proof">
            <div><dt>Sample volume</dt><dd>{formatCurrency(totalVolume, { compact: true })}</dd></div>
            <div><dt>Open markets</dt><dd>{openMarkets.length}</dd></div>
            <div><dt>Sample participants</dt><dd>{formatNumber(totalTraders, true)}</dd></div>
          </dl>
        </div>

        <div className="featured-market-panel">
          <div className="featured-market-head"><span>MARKET IN FOCUS</span><span>{featured?.category ?? "Event contracts"}</span></div>
          {featured && featuredLeader ? (
            <>
              <h2><Link href={marketHref(featured.slug, featured.id)}>{featured.shortQuestion}</Link></h2>
              <div className="featured-market-quote">
                <span>Leading outcome</span>
                <strong>{featuredLeader.label}</strong>
                <b>{featuredLeader.probability.toFixed(1)}<small>%</small></b>
              </div>
              <div className="featured-market-rows">
                {featured.outcomes.slice(0, 3).map((outcome) => (
                  <Link href={marketHref(featured.slug, featured.id, outcome.id)} key={outcome.id}>
                    <span>{outcome.label}</span><i aria-hidden="true"><b style={{ width: `${outcome.probability}%` }} /></i><strong>{outcome.probability.toFixed(1)}%</strong>
                  </Link>
                ))}
              </div>
              <Link className="featured-market-action" href={marketHref(featured.slug, featured.id)}>View contract <span aria-hidden="true">↗</span></Link>
            </>
          ) : <p className="featured-market-empty">No open markets yet. Browse resolved outcomes or publish a new paper scenario.</p>}
        </div>
      </section>

      {signals.length ? (
        <section className="signal-strip desk-signal-strip" aria-label="Paper market pulse">
          {signals.map(({ label, market, value }) => (
            <div key={label}>
              <span>{label}</span>
              <Link href={marketHref(market.slug, market.id)}>{market.shortQuestion}</Link>
              <strong>{value}</strong>
            </div>
          ))}
        </section>
      ) : null}

      <div className="home-content-grid">
        <MarketGrid initialMarkets={markets} heading="Discover markets" />
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
    </div>
  );
}
