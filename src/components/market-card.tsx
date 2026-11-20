"use client";

import Link from "next/link";
import { Bookmark, MessageCircle } from "lucide-react";
import type { Market } from "@/core/contracts/domain";
import { formatCurrency, formatDate } from "@/lib/format";
import { marketHref } from "@/lib/market-href";
import { appConfig } from "@/lib/config";
import { useApp } from "./app-provider";

const statusLabels: Record<Market["status"], string> = {
  open: "Open",
  paused: "Paused",
  resolved: "Resolved",
  draft: "Draft"
};

export function MarketCard({ market: initialMarket, compact = false }: { market: Market; compact?: boolean }) {
  const { favorites, toggleFavorite, marketCatalog } = useApp();
  const market = marketCatalog.find((item) => item.id === initialMarket.id) ?? initialMarket;
  const bookmarked = favorites.has(market.id);
  const leader = market.outcomes.reduce((best, outcome) => outcome.probability > best.probability ? outcome : best, market.outcomes[0]);
  const paper = appConfig.adapter === "mock";
  const tradingOpen = market.status === "open";

  return (
    <article className={`market-card opinny-discovery-card status-${market.status} ${compact ? "compact-card" : ""}`} aria-label={market.shortQuestion}>
      <header className="market-card-top">
        <div className="market-card-title">
          <div className="category-label">
            <span>{market.category}</span>
            <span className="card-meta-divider" aria-hidden="true">/</span>
            <span className={`card-status status-${market.status}`}>{statusLabels[market.status]}</span>
          </div>
          <Link href={marketHref(market.slug, market.id)}>{market.shortQuestion}</Link>
        </div>
        <button className={`bookmark-button ${bookmarked ? "active" : ""}`} type="button" aria-label={bookmarked ? `Remove ${market.shortQuestion} from watchlist` : `Add ${market.shortQuestion} to watchlist`} aria-pressed={bookmarked} onClick={() => toggleFavorite(market.id)}>
          <Bookmark size={17} fill={bookmarked ? "currentColor" : "none"} />
        </button>
      </header>

      {!compact ? (
        <div className="market-card-snapshot">
          <div className="market-card-leader-label"><span>LEADING CONTRACT</span><strong>{leader.label}</strong></div>
          <div className="market-card-leading-price">
            <b>{leader.probability.toFixed(1)}<small>%</small></b>
            <em className={leader.change24h >= 0 ? "positive" : "negative"}>{leader.change24h >= 0 ? "+" : ""}{leader.change24h.toFixed(1)} pp</em>
          </div>
        </div>
      ) : null}

      <div className="outcome-list">
        {market.outcomes.slice(0, compact ? 2 : 4).map((outcome) => (
          <Link className="outcome-row" href={marketHref(market.slug, market.id, tradingOpen ? outcome.id : undefined)} key={outcome.id} aria-label={`${outcome.label}, ${outcome.probability.toFixed(1)} percent probability, ${tradingOpen ? "trade" : "view"}`}>
            <span title={outcome.label}>{outcome.label}</span>
            <span className="probability-track" aria-hidden="true"><i style={{ width: `${outcome.probability}%` }} /></span>
            <strong>{outcome.probability.toFixed(1)}%</strong>
            <span className="outcome-action">{tradingOpen ? "Trade" : "View"}</span>
          </Link>
        ))}
      </div>

      <footer className="market-card-footer">
        <span>{formatCurrency(market.volume, { compact: true })} {paper ? "sample vol." : "vol."}</span>
        <span>{formatCurrency(market.liquidity, { compact: true })} {paper ? "sim. depth" : "depth"}</span>
        {typeof market.commentCount === "number" ? <span className="market-comments"><MessageCircle size={13} />{market.commentCount}</span> : null}
        <time className="end-date" dateTime={market.endDate}>{market.status === "resolved" ? "Resolved" : `Closes ${formatDate(market.endDate)}`}</time>
      </footer>
    </article>
  );
}
