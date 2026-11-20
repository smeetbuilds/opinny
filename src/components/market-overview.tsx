"use client";

import { Activity, CalendarDays, CircleDollarSign, Clock3, TrendingUp, Users } from "lucide-react";
import type { Market } from "@/core/contracts/domain";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { appConfig } from "@/lib/config";
import { useApp } from "./app-provider";
import { TradeOutcomeButton } from "./trade-outcome-button";
import { MarketActions } from "./market-actions";

/** A single live snapshot drives the headline, prices and status after every paper action. */
export function MarketOverview({ initialMarket }: { initialMarket: Market }) {
  const { marketCatalog } = useApp();
  const market = marketCatalog.find((item) => item.id === initialMarket.id) ?? initialMarket;
  const leader = [...market.outcomes].sort((a, b) => b.probability - a.probability)[0];

  return (
            <section className="market-hero-card">
              <div className="market-title-row">
                <span className={`market-avatar large ${market.imageTone}`} aria-hidden="true">{market.icon}</span>
                <div>
                  <div className="market-meta-line"><span>{market.category}</span>{market.live ? <em><i />{appConfig.adapter === "mock" ? "Paper activity" : "Live"}</em> : null}<span>Closes {formatDate(market.endDate)}</span></div>
                  <h1>{market.question}</h1>
                </div>
                <MarketActions marketId={market.id} title={market.question} />
              </div>

              <div className="market-signal-strip">
                <div><TrendingUp size={17} /><span><small>Market leader</small><strong>{leader.label} · {leader.probability}%</strong></span></div>
                <div><Activity size={17} /><span><small>{appConfig.adapter === "mock" ? "24h sample" : "24h activity"}</small><strong>{formatCurrency(market.volume24h, { compact: true })}</strong></span></div>
                <div><Clock3 size={17} /><span><small>Status</small><strong>{market.status === "open" ? "Trading open" : market.status}</strong></span></div>
              </div>

              <div className="headline-outcomes">
                {market.outcomes.map((outcome, index) => (
                  <div className={index === 0 ? "headline-outcome primary" : "headline-outcome"} key={outcome.id}>
                    <span>{outcome.label}</span>
                    <strong>{outcome.probability}%</strong>
                    <em className={outcome.change24h >= 0 ? "positive" : "negative"}>{outcome.change24h >= 0 ? "+" : ""}{outcome.change24h.toFixed(1)} {appConfig.adapter === "mock" ? "paper move" : "today"}</em>
                    {market.status === "open" ? <TradeOutcomeButton outcomeId={outcome.id} label={outcome.label} className={index === 0 ? "yes-button" : "no-button"} /> : <span className="outcome-closed-action">{market.status === "resolved" ? "Final" : "Unavailable"}</span>}
                  </div>
                ))}
              </div>

              <div className="market-stat-grid">
                <div><CircleDollarSign size={17} /><span>Volume</span><strong>{formatCurrency(market.volume, { compact: true })}</strong></div>
                <div><CircleDollarSign size={17} /><span>Liquidity</span><strong>{formatCurrency(market.liquidity, { compact: true })}</strong></div>
                <div><Users size={17} /><span>Traders</span><strong>{formatNumber(market.traders, true)}</strong></div>
                <div><CalendarDays size={17} /><span>Ends</span><strong>{formatDate(market.endDate)}</strong></div>
              </div>
            </section>
  );
}
