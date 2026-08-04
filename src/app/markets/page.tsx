import type { Metadata } from "next";
import { Activity, Layers3, Users } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { MarketGrid } from "@/components/market-grid";
import { dataAdapter } from "@/lib/data";
import { formatCurrency, formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Markets" };

export default async function MarketsPage() {
  const markets = await dataAdapter.listMarkets();
  const openMarkets = markets.filter((market) => market.status === "open");
  const dailyVolume = markets.reduce((sum, market) => sum + market.volume24h, 0);
  const traders = markets.reduce((sum, market) => sum + market.traders, 0);

  return <SiteShell><div className="page-container inner-page"><header className="page-hero page-hero-wide"><div><span className="eyebrow">Discover</span><h1>Markets</h1><p>Browse open questions across politics, crypto, technology, sports, science and culture.</p></div><div className="page-hero-metrics"><div><Layers3 size={17} /><span>Open markets</span><strong>{openMarkets.length}</strong></div><div><Activity size={17} /><span>24h volume</span><strong>{formatCurrency(dailyVolume, { compact: true })}</strong></div><div><Users size={17} /><span>Participants</span><strong>{formatNumber(traders, true)}</strong></div></div></header><MarketGrid initialMarkets={markets} heading="All open markets" /></div></SiteShell>;
}
