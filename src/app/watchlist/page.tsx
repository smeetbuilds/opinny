"use client";

import { SiteShell } from "@/components/site-shell";
import { AccountShell } from "@/components/account-shell";
import { MarketCard } from "@/components/market-card";
import { markets } from "@/adapters/mock/data";
import { useApp } from "@/components/app-provider";

export default function WatchlistPage() {
  const { favorites } = useApp();
  const visible = markets.filter((market) => favorites.has(market.id));
  return <SiteShell><div className="page-container inner-page"><AccountShell title="Watchlist" eyebrow="Saved markets" description="Keep important questions within reach.">{visible.length ? <div className="market-grid">{visible.map((market) => <MarketCard market={market} key={market.id} />)}</div> : <div className="empty-state large-empty"><strong>Your watchlist is empty.</strong><span>Bookmark a market to follow it here.</span></div>}</AccountShell></div></SiteShell>;
}
