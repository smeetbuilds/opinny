import { Activity } from "lucide-react";
import type { RecentTrade } from "@/core/contracts/domain";
import { formatCurrency, formatNumber } from "@/lib/format";

export function RecentTrades({ trades, statusLabel = "Latest matched activity" }: { trades: RecentTrade[]; statusLabel?: string }) {
  const totalShares = trades.reduce((sum, trade) => sum + trade.shares, 0);
  const totalValue = trades.reduce((sum, trade) => sum + trade.value, 0);
  const averagePrice = totalShares ? trades.reduce((sum, trade) => sum + trade.price * trade.shares, 0) / totalShares : 0;
  const buys = trades.filter((trade) => trade.side === "buy").length;

  return (
    <section className="trades-card" aria-labelledby="recent-trades-title">
      <div className="table-title">
        <div><h3 id="recent-trades-title">Recent trades</h3><span><i className="live-pulse" />{statusLabel}</span></div>
        <Activity size={17} />
      </div>
      <div className="trade-activity-summary">
        <span><small>Notional</small><strong>{formatCurrency(totalValue, { compact: true })}</strong></span>
        <span><small>Shares</small><strong>{formatNumber(totalShares, true)}</strong></span>
        <span><small>Avg. price</small><strong>{averagePrice ? `${Math.round(averagePrice * 100)}¢` : "—"}</strong></span>
        <span><small>Buy flow</small><strong>{trades.length ? `${Math.round((buys / trades.length) * 100)}%` : "—"}</strong></span>
      </div>
      {trades.length ? (
        <div className="responsive-table trades-table">
          <table>
            <thead><tr><th>Outcome</th><th>Price</th><th>Shares</th><th>Value</th><th>Trader</th><th>Time</th></tr></thead>
            <tbody>{trades.map((trade) => (
              <tr key={trade.id}>
                <td data-label="Outcome"><span className={`side-pill ${trade.side}`}>{trade.side === "buy" ? "+" : "−"} {trade.outcome}</span></td>
                <td data-label="Price">{Math.round(trade.price * 100)}¢</td>
                <td data-label="Shares">{trade.shares.toLocaleString()}</td>
                <td data-label="Value">{formatCurrency(trade.value)}</td>
                <td data-label="Trader" className="mono">{trade.trader}</td>
                <td data-label="Time">{trade.time}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <div className="table-empty"><Activity size={20} /><strong>No trades yet</strong><span>The first matched order will appear here.</span></div>}
    </section>
  );
}
