import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bookmark, CalendarDays, ChevronRight, CircleDollarSign, ExternalLink, MessageCircle, Share2, ShieldCheck, Users } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { PriceChart } from "@/components/price-chart";
import { TradeTicket } from "@/components/trade-ticket";
import { OrderBook } from "@/components/order-book";
import { RecentTrades } from "@/components/recent-trades";
import { MarketCard } from "@/components/market-card";
import { dataAdapter } from "@/lib/data";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";

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

  return (
    <SiteShell>
      <div className="page-container market-page">
        <div className="breadcrumb"><Link href="/markets">Markets</Link><ChevronRight size={14} /><Link href={`/markets?category=${market.category}`}>{market.category}</Link><ChevronRight size={14} /><span>{market.shortQuestion}</span></div>
        <div className="market-layout">
          <div className="market-main">
            <section className="market-hero-card">
              <div className="market-title-row">
                <span className={`market-avatar large ${market.imageTone}`}>{market.icon}</span>
                <div><div className="market-meta-line"><span>{market.category}</span>{market.live ? <em>Live</em> : null}<span>Closes {formatDate(market.endDate)}</span></div><h1>{market.question}</h1></div>
                <div className="market-actions"><button className="icon-button" aria-label="Save market"><Bookmark size={18} /></button><button className="icon-button" aria-label="Share market"><Share2 size={18} /></button></div>
              </div>
              <div className="headline-outcomes">
                {market.outcomes.map((outcome, index) => <div key={outcome.id}><span>{outcome.label}</span><strong>{outcome.probability}%</strong><em className={outcome.change24h >= 0 ? "positive" : "negative"}>{outcome.change24h >= 0 ? "+" : ""}{outcome.change24h.toFixed(1)} today</em><button className={index === 0 ? "yes-button" : "no-button"}>Trade {outcome.label}</button></div>)}
              </div>
              <div className="market-stat-grid"><div><CircleDollarSign size={17} /><span>Volume</span><strong>{formatCurrency(market.volume, { compact: true })}</strong></div><div><CircleDollarSign size={17} /><span>Liquidity</span><strong>{formatCurrency(market.liquidity, { compact: true })}</strong></div><div><Users size={17} /><span>Traders</span><strong>{formatNumber(market.traders, true)}</strong></div><div><CalendarDays size={17} /><span>Ends</span><strong>{formatDate(market.endDate)}</strong></div></div>
            </section>

            <PriceChart values={market.chart} />

            <section className="market-info-card">
              <div className="content-tabs"><button className="active">Overview</button><button>Comments <span>84</span></button><button>Top holders</button><button>Activity</button></div>
              <div className="market-description"><h2>About this market</h2><p>{market.description}</p><div className="rules-box"><div><ShieldCheck size={18} /><span><strong>Resolution rules</strong><p>{market.resolutionRules}</p></span></div><div className="resolution-source"><span>Primary source</span><button type="button" aria-label={`Open resolution source: ${market.resolutionSource}`}>{market.resolutionSource}<ExternalLink size={14} /></button></div></div></div>
            </section>

            <div className="market-data-grid"><OrderBook bids={book.bids} asks={book.asks} /><RecentTrades trades={trades} /></div>

            <section className="comments-card"><div className="table-title"><h3>Discussion</h3><span>84 comments</span></div><div className="comment-composer"><span className="profile-avatar">MP</span><button>Share your analysis or ask a question…</button></div>{["The recent momentum looks strong, but the deadline still leaves enough time for a major reversal.", "Liquidity has improved considerably this week. Watch the spread before placing a larger order."].map((text, index) => <article className="comment" key={text}><span className="profile-avatar">{index === 0 ? "BR" : "MM"}</span><div><header><strong>{index === 0 ? "Bayes Runner" : "Market Mosaic"}</strong><span>{index === 0 ? "18 min" : "1 hr"}</span></header><p>{text}</p><footer><button><MessageCircle size={14} />Reply</button><button>Useful · {index === 0 ? 18 : 11}</button></footer></div></article>)}</section>

            {related.length ? <section className="related-section"><div className="section-heading-row"><div><span className="eyebrow">Continue exploring</span><h2>Related markets</h2></div></div><div className="market-grid related-grid">{related.map((item) => <MarketCard market={item} key={item.id} />)}</div></section> : null}
          </div>
          <TradeTicket market={market} />
        </div>
      </div>
    </SiteShell>
  );
}
