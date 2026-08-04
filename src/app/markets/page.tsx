import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { MarketGrid } from "@/components/market-grid";
import { dataAdapter } from "@/lib/data";

export const metadata: Metadata = { title: "Markets" };

export default async function MarketsPage() {
  const markets = await dataAdapter.listMarkets();
  return <SiteShell><div className="page-container inner-page"><header className="page-hero"><span className="eyebrow">Discover</span><h1>Markets</h1><p>Browse open questions across politics, crypto, technology, sports, science and culture.</p></header><MarketGrid initialMarkets={markets} heading="All open markets" /></div></SiteShell>;
}
