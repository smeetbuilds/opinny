"use client";

import Link from "next/link";
import { BookmarkPlus } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { AccountShell } from "@/components/account-shell";
import { MarketCard } from "@/components/market-card";
import { markets } from "@/adapters/mock/data";
import { useApp } from "@/components/app-provider";

export default function WatchlistPage() {
  const { favorites } = useApp();
  const visible = markets.filter((market) => favorites.has(market.id));
  return <SiteShell><div className="page-container inner-page"><AccountShell title="Watchlist" eyebrow="Saved markets" description="Keep important questions within reach.">{visible.length ? <><div className="collection-summary"><span><strong>{visible.length}</strong> saved {visible.length === 1 ? "market" : "markets"}</span><Link href="/markets">Discover more</Link></div><div className="market-grid">{visible.map((market) => <MarketCard market={market} key={market.id} />)}</div></> : <div className="empty-state large-empty watchlist-empty"><BookmarkPlus size={28} /><strong>Your watchlist is empty.</strong><span>Bookmark markets you want to monitor and they will appear here.</span><Link className="primary-button compact" href="/markets">Explore markets</Link></div>}</AccountShell></div></SiteShell>;
}
