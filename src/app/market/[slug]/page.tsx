import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Activity, CalendarDays, ChevronRight, CircleDollarSign, Clock3, MessageCircle, ShieldCheck, TrendingUp, Users } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { PriceChart } from "@/components/price-chart";
import { TradeTicket } from "@/components/trade-ticket";
import { TradeOutcomeButton } from "@/components/trade-outcome-button";
import { MarketActions } from "@/components/market-actions";
import { MarketCommentComposer } from "@/components/market-comment-composer";
import { OrderBook } from "@/components/order-book";
import { RecentTrades } from "@/components/recent-trades";
import { MarketCard } from "@/components/market-card";
import { dataAdapter } from "@/lib/data";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

export const dynamicParams = false;

export async function generateStaticParams() {
  const markets = await dataAdapter.listMarkets();
  return markets.map((market) => ({ slug: market.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const market = await dataAdapter.getMarket(slug);
  return { title: market?.shortQuestion ?? "Market", description: market?.description };
}

export default async function MarketPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const marketResult = await dataAdapter.getMarket(slug);
  if (!marketResult) notFound();
  const market = marketResult!;
  const [book, trades, allMarkets] = await Promise.all([
    dataAdapter.getOrderBook(market.id, market.outcomes[0].id),
    dataAdapter.getRecentTrades(market.id),
    dataAdapter.listMarkets({ category: market.category })
  ]);
  const related = allMarkets.filter((item) => item.id !== market.id).slice(0, 3);
  const leader = [...market.outcomes].sort((a, b) => b.probability - a.probability)[0];

  return (
    <SiteShell>
      <div className="page-container market-page">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/markets">Markets</Link><ChevronRight size={14} />
          <Link href={`/markets?category=${market.category}`}>{market.category}</Link><ChevronRight size={14} />
          <span aria-current="page">{market.shortQuestion}</span>
        </nav>

        <div className="market-layout">
          <div className="market-main">
            <section className="market-hero-card">
              <div className="market-title-row">
                <span className={`market-avatar large ${market.imageTone}`} aria-hidden="true">{market.icon}</span>
                <div>
                  <div className="market-meta-line"><span>{market.category}</span>{market.live ? <em><i />Live</em> : null}<span>Closes {formatDate(market.endDate)}</span></div>
                  <h1>{market.question}</h1>
                </div>
                <MarketActions marketId={market.id} title={market.question} />
              </div>

              <div className="market-signal-strip">
                <div><TrendingUp size={17} /><span><small>Market leader</small><strong>{leader.label} · {leader.probability}%</strong></span></div>
                <div><Activity size={17} /><span><small>24h activity</small><strong>{formatCurrency(market.volume24h, { compact: true })}</strong></span></div>
                <div><Clock3 size={17} /><span><small>Resolution</small><strong>{market.status === "open" ? "Trading open" : market.status}</strong></span></div>
              </div>

              <div className="headline-outcomes">
                {market.outcomes.map((outcome, index) => (
                  <div className={index === 0 ? "headline-outcome primary" : "headline-outcome"} key={outcome.id}>
                    <span>{outcome.label}</span>
                    <strong>{outcome.probability}%</strong>
                    <em className={outcome.change24h >= 0 ? "positive" : "negative"}>{outcome.change24h >= 0 ? "+" : ""}{outcome.change24h.toFixed(1)} today</em>
                    <TradeOutcomeButton outcomeId={outcome.id} label={outcome.label} className={index === 0 ? "yes-button" : "no-button"} />
                  </div>
                ))}
              </div>

              <div className="market-stat-grid">
                <div><CircleDollarSign size={17} /><span>Volume</span><strong>{formatCurrency(market.volume, { compact: true })}</strong></div>
                <div><CircleDollarSign size={17} /><span>Liquidity</span><strong>{formatCurrency(market.liquidity, { compact: true })}</strong></div>
                <div><Users size={17} /><span>Traders</span><strong>{formatNumber(market.traders, true)}</strong></div>
                <div><CalendarDays size={17} /><span>Ends</span><strong>{formatDate(market.endDate)}</strong></div>
              </div>
            </section>

            <PriceChart values={market.chart} />

            <section className="market-info-card" id="overview">
              <nav className="content-tabs" aria-label="Market sections">
                <a className="active" href="#overview">Overview</a>
                <a href="#market-depth">Market depth</a>
                <a href="#recent-trades">Trades</a>
                <a href="#discussion">Discussion <span>84</span></a>
              </nav>
              <div className="market-description">
                <div className="section-copy-head"><div><span className="eyebrow">Market context</span><h2>About this market</h2></div><span className="verified-source"><ShieldCheck size={15} />Defined resolution</span></div>
                <p>{market.description}</p>
                <div className="rules-box">
                  <div><ShieldCheck size={18} /><span><strong>Resolution rules</strong><p>{market.resolutionRules}</p></span></div>
                  <div className="resolution-source"><span>Primary source</span><strong>{market.resolutionSource}</strong></div>
                </div>
              </div>
            </section>

            <div className="market-data-grid" id="market-depth">
              <OrderBook bids={book.bids} asks={book.asks} />
              <div id="recent-trades"><RecentTrades trades={trades} /></div>
            </div>

            <section className="comments-card" id="discussion">
              <div className="table-title"><div><h3>Discussion</h3><span>84 comments · Community analysis</span></div><MessageCircle size={17} /></div>
              <MarketCommentComposer />
              {["The recent momentum looks strong, but the deadline still leaves enough time for a major reversal.", "Liquidity has improved considerably this week. Watch the spread before placing a larger order."].map((text, index) => (
                <article className="comment" key={text}>
                  <span className="profile-avatar">{index === 0 ? "BR" : "MM"}</span>
                  <div><header><strong>{index === 0 ? "Bayes Runner" : "Market Mosaic"}</strong><span>{index === 0 ? "18 min" : "1 hr"}</span></header><p>{text}</p><footer><button type="button"><MessageCircle size={14} />Reply</button><button type="button">Useful · {index === 0 ? 18 : 11}</button></footer></div>
                </article>
              ))}
            </section>

            {related.length ? <section className="related-section"><div className="section-heading-row"><div><span className="eyebrow">Continue exploring</span><h2>Related markets</h2></div></div><div className="market-grid related-grid">{related.map((item) => <MarketCard market={item} key={item.id} />)}</div></section> : null}
          </div>
          <TradeTicket market={market} />
        </div>
      </div>
    </SiteShell>
  );
}
