"use client";

import Link from "next/link";
import { Bookmark, MessageCircle, TrendingUp } from "lucide-react";
import type { Market } from "@/core/contracts/domain";
import { formatCurrency, formatDate } from "@/lib/format";
import { useApp } from "./app-provider";

export function MarketCard({ market, compact = false }: { market: Market; compact?: boolean }) {
  const { favorites, toggleFavorite } = useApp();
  const bookmarked = favorites.has(market.id);
  const primary = market.outcomes[0];

  return (
    <article className={`market-card ${compact ? "compact-card" : ""}`}>
      <div className="market-card-top">
        <span className={`market-avatar ${market.imageTone}`}>{market.icon}</span>
        <div className="market-card-title">
          <span className="category-label">{market.category}{market.live ? <em>Live</em> : null}</span>
          <Link href={`/market/${market.slug}`}>{market.shortQuestion}</Link>
        </div>
        <button
          className={`bookmark-button ${bookmarked ? "active" : ""}`}
          aria-label={bookmarked ? "Remove from watchlist" : "Add to watchlist"}
          onClick={() => toggleFavorite(market.id)}
        >
          <Bookmark size={17} fill={bookmarked ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="outcome-list">
        {market.outcomes.slice(0, compact ? 2 : 4).map((outcome, index) => (
          <Link className="outcome-row" href={`/market/${market.slug}`} key={outcome.id}>
            <span>{outcome.label}</span>
            <div className="probability-track"><i style={{ width: `${outcome.probability}%` }} /></div>
            <strong>{outcome.probability}%</strong>
            {index < 2 ? <span className="outcome-action">{index === 0 ? "Buy" : "Trade"}</span> : null}
          </Link>
        ))}
      </div>

      <footer className="market-card-footer">
        <span><TrendingUp size={14} />{formatCurrency(market.volume, { compact: true })} vol.</span>
        <span>{formatCurrency(market.liquidity, { compact: true })} liq.</span>
        <span className="market-comments"><MessageCircle size={14} />{Math.max(14, Math.round(market.traders / 180))}</span>
        <span className="end-date">Ends {formatDate(market.endDate)}</span>
      </footer>
      {primary.change24h !== 0 ? <span className={`card-change ${primary.change24h > 0 ? "positive" : "negative"}`}>{primary.change24h > 0 ? "+" : ""}{primary.change24h.toFixed(1)} today</span> : null}
    </article>
  );
}
