"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, ShieldCheck } from "lucide-react";
import type { Market, OrderBookLevel, RecentTrade } from "@/core/contracts/domain";
import { dataAdapter } from "@/lib/data";
import { SiteShell } from "@/components/site-shell";
import { PriceChart } from "@/components/price-chart";
import { TradeTicket } from "@/components/trade-ticket";
import { TradeOutcomeButton } from "@/components/trade-outcome-button";
import { MarketActions } from "@/components/market-actions";
import { MarketLiveData } from "@/components/market-live-data";
import { MarketOpenOrders } from "@/components/market-open-orders";
import { MarketDiscussion } from "@/components/market-discussion";
import { formatDate, formatCurrency } from "@/lib/format";

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
              <section className="market-hero-card">
                <div className="market-title-row">
                  <span className={"market-avatar large " + loaded.market.imageTone} aria-hidden="true">{loaded.market.icon}</span>
                  <div><div className="market-meta-line"><span>{loaded.market.category}</span><span>Local simulation</span></div><h1>{loaded.market.question}</h1></div>
                  <MarketActions marketId={loaded.market.id} title={loaded.market.question} />
                </div>
                <div className="market-signal-strip">
                  <div><CalendarDays size={17} /><span><small>Closes</small><strong>{formatDate(loaded.market.endDate)}</strong></span></div>
                  <div><ShieldCheck size={17} /><span><small>Status</small><strong>{loaded.market.status}</strong></span></div>
                  <div><span><small>Simulated volume</small><strong>{formatCurrency(loaded.market.volume, { compact: true })}</strong></span></div>
                </div>
                <div className="headline-outcomes">
                  {loaded.market.outcomes.map((outcome, index) => (
                    <div className={index === 0 ? "headline-outcome primary" : "headline-outcome"} key={outcome.id}>
                      <span>{outcome.label}</span><strong>{outcome.probability}%</strong>
                      {loaded.market.status === "open" ? <TradeOutcomeButton outcomeId={outcome.id} label={outcome.label} className={index === 0 ? "yes-button" : "no-button"} /> : <span className="outcome-closed-action">{loaded.market.status === "resolved" ? "Final" : "Unavailable"}</span>}
                    </div>
                  ))}
                </div>
              </section>
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
