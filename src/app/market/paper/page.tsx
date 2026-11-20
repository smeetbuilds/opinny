"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import type { Market, OrderBookLevel, RecentTrade } from "@/core/contracts/domain";
import { dataAdapter } from "@/lib/data";
import { SiteShell } from "@/components/site-shell";
import { PriceChart } from "@/components/price-chart";
import { TradeTicket } from "@/components/trade-ticket";
import { MarketOverview } from "@/components/market-overview";
import { MarketLiveData } from "@/components/market-live-data";
import { MarketOpenOrders } from "@/components/market-open-orders";
import { MarketDiscussion } from "@/components/market-discussion";

type LoadedMarket = { market: Market; book: { bids: OrderBookLevel[]; asks: OrderBookLevel[] }; trades: RecentTrade[] };

function LocalPaperMarket() {
  const params = useSearchParams();
  const id = params.get("id");
  const [loaded, setLoaded] = useState<LoadedMarket | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      try {
        if (!id || !id.startsWith("paper-market-")) { if (mounted) setFailed(true); return; }
        const market = (await dataAdapter.listMarkets()).find((item) => item.id === id);
        if (!market) { if (mounted) setFailed(true); return; }
        const [book, trades] = await Promise.all([
          dataAdapter.getOrderBook(market.id, market.outcomes[0].id),
          dataAdapter.getRecentTrades(market.id)
        ]);
        if (mounted) { setLoaded({ market, book, trades }); setFailed(false); }
      } catch { if (mounted) setFailed(true); }
    };
    void refresh();
    window.addEventListener("opinny:paper-update", refresh);
    return () => { mounted = false; window.removeEventListener("opinny:paper-update", refresh); };
  }, [id]);

  return (
    <SiteShell>
      <div className="page-container market-page">
        <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/markets"><ArrowLeft size={15} /> All markets</Link><span>Local paper market</span></nav>
        {failed ? (
          <section className="market-info-card"><h1>Local market not found</h1><p>This market exists only in the browser where it was created. It may have been reset or cleared.</p><Link href="/markets">Explore markets</Link></section>
        ) : !loaded ? (
          <section className="market-info-card" role="status"><p>Loading the browser-local market…</p></section>
        ) : (
          <div className="market-layout">
            <div className="market-main">
              <MarketOverview initialMarket={loaded.market} />
              <PriceChart marketId={loaded.market.id} values={loaded.market.chart} />
              <section className="market-info-card"><div className="market-description"><div className="section-copy-head"><div><span className="eyebrow">Market context</span><h2>Resolution rules</h2></div></div><p>{loaded.market.resolutionRules}</p><div className="rules-box"><div><ShieldCheck size={18} /><span><strong>Primary source</strong><p>{loaded.market.resolutionSource}</p></span></div></div></div></section>
              <MarketLiveData market={loaded.market} initialBook={loaded.book} initialTrades={loaded.trades} />
              <div id="market-open-orders"><MarketOpenOrders marketSlug={loaded.market.slug} /></div>
              <MarketDiscussion marketId={loaded.market.id} initialComments={[]} />
            </div>
            <TradeTicket market={loaded.market} />
          </div>
        )}
      </div>
    </SiteShell>
  );
}

export default function PaperMarketPage() {
  return <Suspense fallback={<SiteShell><div className="page-container market-page" role="status">Loading local market…</div></SiteShell>}><LocalPaperMarket /></Suspense>;
}
