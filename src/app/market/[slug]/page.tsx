import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { PriceChart } from "@/components/price-chart";
import { TradeTicket } from "@/components/trade-ticket";
import { MarketOverview } from "@/components/market-overview";
import { MarketDiscussion } from "@/components/market-discussion";
import { MarketLiveData } from "@/components/market-live-data";
import { MarketOpenOrders } from "@/components/market-open-orders";
import { MarketCard } from "@/components/market-card";
import { dataAdapter } from "@/lib/data";

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
  const market = await dataAdapter.getMarket(slug);
  if (!market) notFound();

  const [book, trades, comments, allMarkets] = await Promise.all([
    dataAdapter.getOrderBook(market.id, market.outcomes[0].id),
    dataAdapter.getRecentTrades(market.id),
    dataAdapter.getMarketComments(market.id),
    dataAdapter.listMarkets({ category: market.category })
  ]);
  const related = allMarkets.filter((item) => item.id !== market.id).slice(0, 3);

  return (
    <SiteShell>
      <div className="page-container market-page">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link href="/markets">Markets</Link><ChevronRight size={14} />
          <Link href={`/markets?category=${encodeURIComponent(market.category)}`}>{market.category}</Link><ChevronRight size={14} />
          <span aria-current="page">{market.shortQuestion}</span>
        </nav>

        <div className="market-layout">
          <div className="market-main">
            <MarketOverview initialMarket={market} />

            <PriceChart marketId={market.id} values={market.chart} />

            <section className="market-info-card" id="overview">
              <nav className="content-tabs" aria-label="Market sections">
                <a className="active" href="#overview">Overview</a>
                <a href="#market-depth">Market depth</a>
                <a href="#market-open-orders">Orders</a>
                <a href="#recent-trades">Trades</a>
                <a href="#discussion">Discussion</a>
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

            <MarketLiveData market={market} initialBook={book} initialTrades={trades} />
            <div id="market-open-orders"><MarketOpenOrders marketSlug={market.slug} /></div>
            <MarketDiscussion marketId={market.id} initialComments={comments} />

            {related.length ? <section className="related-section"><div className="section-heading-row"><div><span className="eyebrow">Continue exploring</span><h2>Related markets</h2></div></div><div className="market-grid related-grid">{related.map((item) => <MarketCard market={item} key={item.id} />)}</div></section> : null}
          </div>
          <TradeTicket market={market} />
        </div>
      </div>
    </SiteShell>
  );
}
