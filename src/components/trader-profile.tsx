"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Copy, MessageCircle, Repeat2, Share2, UserPlus } from "lucide-react";
import type { ActivityItem, LeaderboardEntry, Market, MarketComment } from "@/core/contracts/domain";
import { formatCurrency, formatDate } from "@/lib/format";
import { MarketCard } from "./market-card";
import { useApp } from "./app-provider";

type Tab = "positions" | "activity" | "comments";

export function TraderProfile({ profile, markets, activity, comments }: { profile: LeaderboardEntry; markets: Market[]; activity: ActivityItem[]; comments: MarketComment[] }) {
  const { notify } = useApp();
  const [tab, setTab] = useState<Tab>("positions");
  const [following, setFollowing] = useState(false);
  const followKey = `opinny-follow-${profile.handle}`;

  useEffect(() => setFollowing(localStorage.getItem(followKey) === "1"), [followKey]);
  const relevantMarkets = useMemo(() => markets.filter((market) => profile.categories.includes(market.category)).slice(0, 6), [markets, profile.categories]);
  const marketById = useMemo(() => new Map(markets.map((market) => [market.id, market])), [markets]);

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
    try {
      await navigator.clipboard.writeText(profile.wallet);
      notify("Wallet address copied", profile.wallet);
    } catch {
      notify("Copy failed", "The browser did not allow clipboard access.", "system");
    }
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
      <section className="profile-header-card enhanced-profile-header"><div className="profile-identity"><span className="profile-avatar profile-hero-avatar">{profile.initials}</span><div><h1>{profile.displayName}</h1><span>@{profile.handle}</span><p>{profile.bio}</p><div className="profile-meta"><span><CalendarDays size={14} />Joined {formatDate(profile.joinedAt)}</span><button type="button" onClick={() => void copyWallet()}><span className="mono">{profile.wallet.slice(0, 8)}…{profile.wallet.slice(-4)}</span><Copy size={13} /></button></div><div className="profile-category-list">{profile.categories.map((category) => <span key={category}>{category}</span>)}</div></div></div><div className="profile-actions"><button className="secondary-button compact" type="button" onClick={() => void share()}><Share2 size={15} />Share</button><button className={following ? "secondary-button compact following" : "primary-button compact"} type="button" aria-pressed={following} onClick={toggleFollow}>{following ? <Check size={15} /> : <UserPlus size={15} />}{following ? "Following" : "Follow"}</button></div></section>

      <div className="profile-stat-grid"><article><span>Monthly profit</span><strong className="positive">+{formatCurrency(profile.monthlyProfit)}</strong></article><article><span>Total volume</span><strong>{formatCurrency(profile.volume, { compact: true })}</strong></article><article><span>Forecast accuracy</span><strong>{profile.accuracy}%</strong></article><article><span>Followers</span><strong>{(profile.followers + (following ? 1 : 0)).toLocaleString()}</strong></article></div>

      <section className="profile-content enhanced-profile-content"><div className="content-tabs profile-tabs" role="tablist" aria-label="Trader profile sections"><button role="tab" type="button" aria-selected={tab === "positions"} className={tab === "positions" ? "active" : ""} onClick={() => setTab("positions")}>Markets <span>{relevantMarkets.length}</span></button><button role="tab" type="button" aria-selected={tab === "activity"} className={tab === "activity" ? "active" : ""} onClick={() => setTab("activity")}>Activity</button><button role="tab" type="button" aria-selected={tab === "comments"} className={tab === "comments" ? "active" : ""} onClick={() => setTab("comments")}>Comments <span>{comments.length}</span></button></div>{tab === "positions" ? <div className="market-grid related-grid">{relevantMarkets.map((market) => <MarketCard market={market} key={market.id} />)}</div> : null}{tab === "activity" ? <div className="profile-activity-list">{activity.slice(0, 5).map((item) => <article key={item.id}><span><Repeat2 size={16} /></span><div><strong>{item.title}</strong><small>{item.description}</small></div>{item.amount !== undefined ? <em className={item.amount >= 0 ? "positive" : "negative"}>{item.amount >= 0 ? "+" : "−"}{formatCurrency(Math.abs(item.amount))}</em> : null}<time>{item.time}</time></article>)}</div> : null}{tab === "comments" ? <div className="profile-comment-list">{comments.length ? comments.map((comment) => <article key={comment.id}><span className="profile-avatar">{profile.initials}</span><div><header><strong>@{profile.handle}</strong><time>{formatDate(comment.createdAt)}</time></header><p>{comment.body}</p><footer><MessageCircle size={14} />{marketById.get(comment.marketId)?.shortQuestion ?? "Market discussion"}</footer></div></article>) : <div className="table-empty large"><MessageCircle size={22} /><strong>No public comments</strong><span>This trader has no adapter-supplied discussion comments in the current market set.</span></div>}</div> : null}</section>
    </>
  );
}
