import type { RecentTrade } from "@/core/contracts/domain";
import { formatCurrency } from "@/lib/format";

export function RecentTrades({ trades }: { trades: RecentTrade[] }) {
  return <div className="trades-card"><div className="table-title"><h3>Recent trades</h3><span>Updates automatically</span></div><div className="responsive-table"><table><thead><tr><th>Outcome</th><th>Price</th><th>Shares</th><th>Value</th><th>Trader</th><th>Time</th></tr></thead><tbody>{trades.map((trade) => <tr key={trade.id}><td><span className={`side-pill ${trade.side}`}>{trade.side === "buy" ? "+" : "−"} {trade.outcome}</span></td><td>{Math.round(trade.price * 100)}¢</td><td>{trade.shares.toLocaleString()}</td><td>{formatCurrency(trade.value)}</td><td className="mono">{trade.trader}</td><td>{trade.time}</td></tr>)}</tbody></table></div></div>;
}
