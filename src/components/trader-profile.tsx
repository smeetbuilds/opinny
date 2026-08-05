"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Copy, MessageCircle, Repeat2, Share2, UserPlus } from "lucide-react";
import type { ActivityItem, LeaderboardEntry, Market } from "@/core/contracts/domain";
import { formatCurrency, formatDate } from "@/lib/format";
import { MarketCard } from "./market-card";
import { useApp } from "./app-provider";

type Tab = "positions" | "activity" | "comments";

export function TraderProfile({ profile, markets, activity }: { profile: LeaderboardEntry; markets: Market[]; activity: ActivityItem[] }) {
  const { notify } = useApp();
  const [tab, setTab] = useState<Tab>("positions");
  const [following, setFollowing] = useState(false);
  const followKey = `opinny-follow-${profile.handle}`;

  useEffect(() => setFollowing(localStorage.getItem(followKey) === "1"), [followKey]);
  const relevantMarkets = useMemo(() => markets.filter((market) => profile.categories.includes(market.category)).slice(0, 6), [markets, profile.categories]);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: `${profile.displayName} on Opinny`, text: profile.bio, url });
      else {
        await navigator.clipboard.writeText(url);
        notify("Profile link copied", "Share this trader profile anywhere.");
      }
    } catch {
      // Native share cancellation is not an error state for the product.
    }
  }

  async function copyWallet() {
    await navigator.clipboard.writeText(profile.wallet);
    notify("Wallet address copied", profile.wallet);
  }

  function toggleFollow() {
    const next = !following;
    setFollowing(next);
    if (next) localStorage.setItem(followKey, "1");
    else localStorage.removeItem(followKey);
    notify(next ? "Trader followed" : "Trader unfollowed", `@${profile.handle}`);
  }

  return (
    <>
      <section className="profile-header-card enhanced-profile-header"><div className="profile-identity"><span className="profile-avatar profile-hero-avatar">{profile.initials}</span><div><h1>{profile.displayName}</h1><span>@{profile.handle}</span><p>{profile.bio}</p><div className="profile-meta"><span><CalendarDays size={14} />Joined {formatDate(profile.joinedAt)}</span><button type="button" onClick={copyWallet}><span className="mono">{profile.wallet.slice(0, 8)}…{profile.wallet.slice(-4)}</span><Copy size={13} /></button></div><div className="profile-category-list">{profile.categories.map((category) => <span key={category}>{category}</span>)}</div></div></div><div className="profile-actions"><button className="secondary-button compact" type="button" onClick={share}><Share2 size={15} />Share</button><button className={following ? "secondary-button compact following" : "primary-button compact"} type="button" aria-pressed={following} onClick={toggleFollow}>{following ? <Check size={15} /> : <UserPlus size={15} />}{following ? "Following" : "Follow"}</button></div></section>

      <div className="profile-stat-grid"><article><span>Monthly profit</span><strong className="positive">+{formatCurrency(profile.monthlyProfit)}</strong></article><article><span>Total volume</span><strong>{formatCurrency(profile.volume, { compact: true })}</strong></article><article><span>Forecast accuracy</span><strong>{profile.accuracy}%</strong></article><article><span>Followers</span><strong>{(profile.followers + (following ? 1 : 0)).toLocaleString()}</strong></article></div>

      <section className="profile-content enhanced-profile-content"><div className="content-tabs profile-tabs" role="tablist" aria-label="Trader profile sections"><button role="tab" type="button" aria-selected={tab === "positions"} className={tab === "positions" ? "active" : ""} onClick={() => setTab("positions")}>Markets <span>{relevantMarkets.length}</span></button><button role="tab" type="button" aria-selected={tab === "activity"} className={tab === "activity" ? "active" : ""} onClick={() => setTab("activity")}>Activity</button><button role="tab" type="button" aria-selected={tab === "comments"} className={tab === "comments" ? "active" : ""} onClick={() => setTab("comments")}>Comments</button></div>{tab === "positions" ? <div className="market-grid related-grid">{relevantMarkets.map((market) => <MarketCard market={market} key={market.id} />)}</div> : null}{tab === "activity" ? <div className="profile-activity-list">{activity.slice(0, 5).map((item) => <article key={item.id}><span><Repeat2 size={16} /></span><div><strong>{item.title}</strong><small>{item.description}</small></div>{item.amount !== undefined ? <em className={item.amount >= 0 ? "positive" : "negative"}>{item.amount >= 0 ? "+" : "−"}{formatCurrency(Math.abs(item.amount))}</em> : null}<time>{item.time}</time></article>)}</div> : null}{tab === "comments" ? <div className="profile-comment-list">{["Liquidity is improving, but I am keeping size modest until the spread tightens.", "The resolution source matters more than the headline. Read the criteria before entering."].map((comment, index) => <article key={comment}><span className="profile-avatar">{profile.initials}</span><div><header><strong>@{profile.handle}</strong><time>{index ? "5 days" : "2 days"}</time></header><p>{comment}</p><footer><MessageCircle size={14} />Market discussion</footer></div></article>)}</div> : null}</section>
    </>
  );
}
