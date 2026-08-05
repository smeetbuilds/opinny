import Link from "next/link";
import { ArrowRight, BarChart3, Clock3, Flame, Sparkles } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { MarketGrid } from "@/components/market-grid";
import { MarketCard } from "@/components/market-card";
import { dataAdapter } from "@/lib/data";
import { formatCurrency, formatNumber } from "@/lib/format";

export default async function HomePage() {
  const [markets, leaderboard] = await Promise.all([dataAdapter.listMarkets({ sort: "trending" }), dataAdapter.getLeaderboard()]);
  const openMarkets = markets.filter((market) => market.status === "open");
  const featured = (openMarkets.filter((market) => market.featured).length ? openMarkets.filter((market) => market.featured) : openMarkets).slice(0, 3);
  const trending = [...openMarkets].sort((a, b) => b.volume24h - a.volume24h).slice(0, 5);
  const mostActive = trending[0];
  const largestMove = [...openMarkets].sort((a, b) => Math.abs(b.outcomes[0]?.change24h ?? 0) - Math.abs(a.outcomes[0]?.change24h ?? 0))[0];
  const endingSoon = [...openMarkets].sort((a, b) => +new Date(a.endDate) - +new Date(b.endDate))[0];
  const totalVolume = markets.reduce((sum, market) => sum + market.volume, 0);
  const totalTraders = markets.reduce((sum, market) => sum + market.traders, 0);
  const topTrader = [...leaderboard].sort((a, b) => b.monthlyProfit - a.monthlyProfit)[0];

  const signals = [
    mostActive ? { icon: Flame, label: "Most active", market: mostActive, value: `${mostActive.outcomes[0].probability}%` } : null,
    largestMove ? { icon: BarChart3, label: "Largest move", market: largestMove, value: `${largestMove.outcomes[0].change24h >= 0 ? "+" : ""}${largestMove.outcomes[0].change24h.toFixed(1)}` } : null,
    endingSoon ? { icon: Clock3, label: "Ending soon", market: endingSoon, value: formatCurrency(endingSoon.volume24h, { compact: true }) } : null
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <SiteShell>
      <div className="home-page page-container">
        <section className="hero-grid">
          <div className="hero-copy">
            <span className="hero-kicker"><Sparkles size={14} />Live collective probability</span>
            <h1>Trade what you think happens next.</h1>
            <p>Explore event markets, express a view with crypto collateral, and follow probabilities as new information arrives.</p>
            <div className="hero-actions"><Link className="primary-button" href="/markets">Explore markets <ArrowRight size={17} /></Link><Link className="secondary-button" href="/portfolio">View portfolio</Link></div>
            <div className="hero-proof"><div><strong>{formatCurrency(totalVolume, { compact: true })}</strong><span>Total volume</span></div><div><strong>{openMarkets.length}</strong><span>Open markets</span></div><div><strong>{formatNumber(totalTraders, true)}</strong><span>Market participants</span></div></div>
          </div>
          <div className="hero-market-stack"><div className="stack-glow" />{featured.map((market, index) => <div className={`stack-card stack-${index + 1}`} key={market.id}><MarketCard market={market} compact /></div>)}</div>
        </section>

        {signals.length ? <section className="signal-strip">{signals.map(({ icon: Icon, label, market, value }) => <div key={label}><Icon size={17} /><span>{label}</span><Link href={`/market/${market.slug}`}>{market.shortQuestion}</Link><strong>{value}</strong></div>)}</section> : null}

        <div className="home-content-grid">
          <MarketGrid initialMarkets={markets} heading="Live markets" />
          <aside className="trending-sidebar">
            <div className="sidebar-head"><div><span className="eyebrow">Pulse</span><h2>Trending</h2></div><Link href="/markets">See all</Link></div>
            <div className="trend-list">{trending.map((market, index) => <Link href={`/market/${market.slug}`} key={market.id}><span className="trend-rank">{String(index + 1).padStart(2, "0")}</span><span className={`market-avatar small ${market.imageTone}`}>{market.icon}</span><span className="trend-copy"><strong>{market.shortQuestion}</strong><small>{formatCurrency(market.volume24h, { compact: true })} today</small></span><em>{market.outcomes[0].probability}%</em></Link>)}</div>
            {topTrader ? <div className="leaderboard-teaser"><span className="eyebrow">Top trader this month</span><div><span className="profile-avatar">{topTrader.initials}</span><span><strong>{topTrader.displayName}</strong><small>+{formatCurrency(topTrader.monthlyProfit)} profit</small></span><b>#1</b></div><Link href={`/profile/${topTrader.handle}`}>Open profile <ArrowRight size={15} /></Link></div> : null}
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}
