import type { Metadata } from "next";
import { CalendarDays, Copy, Share2 } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { MarketCard } from "@/components/market-card";
import { dataAdapter } from "@/lib/data";
import { markets } from "@/adapters/mock/data";
import { formatCurrency } from "@/lib/format";

export const metadata: Metadata = { title: "Trader profile" };
export const dynamicParams = false;

export async function generateStaticParams() {
  const entries = await dataAdapter.getLeaderboard();
  return entries.map((entry) => ({ handle: entry.handle }));
}

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const entries = await dataAdapter.getLeaderboard();
  const profile = entries.find((entry) => entry.handle === handle) ?? entries[0];
  return <SiteShell><div className="page-container inner-page"><section className="profile-header-card"><div className="profile-identity"><span className="profile-avatar profile-hero-avatar">{profile.initials}</span><div><h1>{profile.displayName}</h1><span>@{profile.handle}</span><p>Macro, technology and crypto markets. Patient entries, explicit exit levels.</p><div className="profile-meta"><span><CalendarDays size={14} />Joined May 2026</span><span>0x19B6…7A42 <Copy size={13} /></span></div></div></div><div className="profile-actions"><button className="secondary-button compact"><Share2 size={15} />Share</button><button className="primary-button compact">Follow</button></div></section><div className="profile-stat-grid"><article><span>Realised profit</span><strong className="positive">+{formatCurrency(profile.profit)}</strong></article><article><span>Total volume</span><strong>{formatCurrency(profile.volume, { compact: true })}</strong></article><article><span>Forecast accuracy</span><strong>{profile.accuracy}%</strong></article><article><span>Followers</span><strong>8,412</strong></article></div><section className="profile-content"><div className="content-tabs"><button className="active">Positions</button><button>Activity</button><button>Comments</button></div><div className="market-grid related-grid">{markets.slice(0, 3).map((market) => <MarketCard market={market} key={market.id} />)}</div></section></div></SiteShell>;
}
