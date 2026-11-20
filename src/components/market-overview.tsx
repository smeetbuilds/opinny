"use client";

import type { Market } from "@/core/contracts/domain";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { appConfig } from "@/lib/config";
import { useApp } from "./app-provider";
import { TradeOutcomeButton } from "./trade-outcome-button";
import { MarketActions } from "./market-actions";

const statusName: Record<Market["status"], string> = {
  open: "Trading open",
  paused: "Trading paused",
  resolved: "Resolved",
  draft: "Not published"
};

/**
 * Trading-first editorial header: the question and executable outcome prices
 * lead. Simulated volume is context, not a promotional hero metric.
 */
export function MarketOverview({ initialMarket }: { initialMarket: Market }) {
  const { marketCatalog } = useApp();
  const market = marketCatalog.find((item) => item.id === initialMarket.id) ?? initialMarket;
  const paper = appConfig.adapter === "mock";

  return (
    <section className="market-hero-card opinny-market-overview" aria-labelledby="market-question">
      <div className="market-title-row">
        <div className="market-title-copy">
          <div className="market-meta-line">
            <span>{market.category}</span>
            <span className="market-meta-separator" aria-hidden="true">/</span>
            <span>{market.kind === "binary" ? "Binary market" : `${market.outcomes.length} outcomes`}</span>
            <span className={`market-status-text status-${market.status}`}>{statusName[market.status]}</span>
          </div>
          <h1 id="market-question">{market.question}</h1>
          <p className="market-deadline">Scheduled close: <time dateTime={market.endDate}>{formatDate(market.endDate)}</time></p>
        </div>
        <MarketActions marketId={market.id} title={market.question} />
      </div>

      <div className="contract-board" aria-label="Market outcome prices">
        <div className="contract-board-head">
          <div>
            <span className="eyebrow">OUTCOME PRICES</span>
            <h2>Where the market stands</h2>
          </div>
          <p>{paper ? "Simulated quotes · not live market data" : "Current implied probabilities"}</p>
        </div>
        <div className="contract-list">
          {market.outcomes.map((outcome) => (
            <div className="contract-quote-row" key={outcome.id}>
              <div className="contract-name">
                <strong>{outcome.label}</strong>
                <span className={outcome.change24h >= 0 ? "positive" : "negative"}>
                  {outcome.change24h >= 0 ? "+" : ""}{outcome.change24h.toFixed(1)} pp
                  <span className="contract-move-label">{paper ? " · sample move" : " · 24h"}</span>
                </span>
              </div>
              <div className="contract-pricing">
                <strong>{outcome.probability.toFixed(1)}<small>%</small></strong>
                <span className="contract-probability-bar" aria-hidden="true"><i style={{ width: `${outcome.probability}%` }} /></span>
              </div>
              {market.status === "open"
                ? <TradeOutcomeButton outcomeId={outcome.id} label={outcome.label} className="contract-trade-action" />
                : <span className="contract-closed">{market.status === "resolved" ? "Final" : "Closed"}</span>}
            </div>
          ))}
        </div>
      </div>

      <dl className="market-key-stats">
        <div><dt>{paper ? "Sample volume" : "Total volume"}</dt><dd>{formatCurrency(market.volume, { compact: true })}</dd></div>
        <div><dt>{paper ? "Simulated depth" : "Liquidity"}</dt><dd>{formatCurrency(market.liquidity, { compact: true })}</dd></div>
        <div><dt>{paper ? "Sample participants" : "Traders"}</dt><dd>{formatNumber(market.traders, true)}</dd></div>
        <div><dt>{paper ? "Sample 24h volume" : "24h volume"}</dt><dd>{formatCurrency(market.volume24h, { compact: true })}</dd></div>
      </dl>
    </section>
  );
}
