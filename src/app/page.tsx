import Link from "next/link";
import { ArrowRight, BarChart3, Clock3, Flame, Sparkles } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { MarketGrid } from "@/components/market-grid";
import { MarketCard } from "@/components/market-card";
import { dataAdapter } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

export default async function HomePage() {
  const markets = await dataAdapter.listMarkets({ sort: "trending" });
  const featured = markets.filter((market) => market.featured).slice(0, 3);
  const trending = markets.slice(0, 5);

  return (
    <SiteShell>
      <div className="home-page page-container">
        <section className="hero-grid">
          <div className="hero-copy">
            <span className="hero-kicker"><Sparkles size={14} />Real-time collective probability</span>
            <h1>Trade what you think happens next.</h1>
            <p>Explore event markets, express a view, and follow the probability as new information arrives.</p>
            <div className="hero-actions">
              <Link className="primary-button" href="/markets">Explore markets <ArrowRight size={17} /></Link>
              <Link className="secondary-button" href="/portfolio">View portfolio</Link>
            </div>
            <div className="hero-proof">
              <div><strong>$48.2M</strong><span>30-day volume</span></div>
              <div><strong>284</strong><span>Open markets</span></div>
              <div><strong>38.4K</strong><span>Active traders</span></div>
            </div>
          </div>
          <div className="hero-market-stack">
            <div className="stack-glow" />
            {featured.map((market, index) => <div className={`stack-card stack-${index + 1}`} key={market.id}><MarketCard market={market} compact /></div>)}
          </div>
        </section>

        <section className="signal-strip">
          <div><Flame size={17} /><span>Most active</span><Link href={`/market/${trending[0].slug}`}>{trending[0].shortQuestion}</Link><strong>{trending[0].outcomes[0].probability}%</strong></div>
          <div><BarChart3 size={17} /><span>Largest move</span><Link href={`/market/${trending[3].slug}`}>{trending[3].shortQuestion}</Link><strong>+{trending[3].outcomes[0].change24h.toFixed(1)}</strong></div>
          <div><Clock3 size={17} /><span>Ending soon</span><Link href={`/market/${trending[4].slug}`}>{trending[4].shortQuestion}</Link><strong>{formatCurrency(trending[4].volume24h, { compact: true })}</strong></div>
        </section>

        <div className="home-content-grid">
          <MarketGrid initialMarkets={markets} heading="Live markets" />
          <aside className="trending-sidebar">
            <div className="sidebar-head"><div><span className="eyebrow">Pulse</span><h2>Trending</h2></div><Link href="/markets">See all</Link></div>
            <div className="trend-list">
              {trending.map((market, index) => <Link href={`/market/${market.slug}`} key={market.id}><span className="trend-rank">{String(index + 1).padStart(2, "0")}</span><span className={`market-avatar small ${market.imageTone}`}>{market.icon}</span><span className="trend-copy"><strong>{market.shortQuestion}</strong><small>{formatCurrency(market.volume24h, { compact: true })} today</small></span><em>{market.outcomes[0].probability}%</em></Link>)}
            </div>
            <div className="leaderboard-teaser">
              <span className="eyebrow">Top trader this month</span>
              <div><span className="profile-avatar">SC</span><span><strong>Signal Craft</strong><small>+$128,420 profit</small></span><b>#1</b></div>
              <Link href="/leaderboard">Open leaderboard <ArrowRight size={15} /></Link>
            </div>
          </aside>
        </div>
      </div>
    </SiteShell>
  );
}
