import type { OrderBookLevel } from "@/core/contracts/domain";
import { formatNumber } from "@/lib/format";

function Side({ levels, type }: { levels: OrderBookLevel[]; type: "asks" | "bids" }) {
  const max = Math.max(1, ...levels.map((level) => level.total));
  const asks = type === "asks";

  return (
    <div className={`book-side ${type}`} aria-label={asks ? "Simulated sell offers" : "Simulated buy bids"}>
      <div className="book-side-heading">
        <strong>{asks ? "Sell offers" : "Buy bids"}</strong>
        <span>{levels.length} price levels</span>
      </div>
      <div className="book-column-head" aria-hidden="true"><span>Price</span><span>Shares</span><span>Cumulative</span></div>
      {levels.length ? levels.map((level) => (
        <div className="book-row" key={`${type}-${level.price}`} aria-label={`${(level.price * 100).toFixed(1)} cents, ${formatNumber(level.size)} shares, ${formatNumber(level.total)} cumulative`}>
          <i style={{ width: `${level.total / max * 100}%` }} aria-hidden="true" />
          <span data-label="Price">{(level.price * 100).toFixed(1)}¢</span>
          <span data-label="Shares">{formatNumber(level.size)}</span>
          <span data-label="Cumulative">{formatNumber(level.total)}</span>
        </div>
      )) : <div className="book-empty">No {asks ? "sell offers" : "buy bids"} in the current simulated book.</div>}
    </div>
  );
}

export function OrderBook({ bids, asks }: { bids: OrderBookLevel[]; asks: OrderBookLevel[] }) {
  const bestBid = bids[0]?.price ?? 0;
  const bestAsk = asks[0]?.price ?? 0;
  const spread = bestBid && bestAsk ? Math.max(bestAsk - bestBid, 0) : 0;
  const midpoint = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : bestBid || bestAsk;

  return (
    <section className="book-card opinny-order-book" aria-labelledby="order-book-title">
      <div className="book-head">
        <div><h3 id="order-book-title">Order book</h3><span>Finite simulated counterparty liquidity</span></div>
      </div>
      <div className="book-quote-strip">
        <span><small>Best bid</small><strong>{bestBid ? `${(bestBid * 100).toFixed(1)}¢` : "—"}</strong></span>
        <span><small>Midpoint</small><strong>{midpoint ? `${(midpoint * 100).toFixed(1)}¢` : "—"}</strong></span>
        <span><small>Best ask</small><strong>{bestAsk ? `${(bestAsk * 100).toFixed(1)}¢` : "—"}</strong></span>
      </div>
      <Side levels={[...asks].sort((a, b) => b.price - a.price)} type="asks" />
      <div className="book-spread">
        <span>Bid–ask spread</span>
        <strong>{bestBid && bestAsk ? `${(spread * 100).toFixed(1)}¢` : "—"}</strong>
        <em>{bestBid && bestAsk ? `${(spread / midpoint * 100).toFixed(2)}% of midpoint` : "No two-sided market"}</em>
      </div>
      <Side levels={[...bids].sort((a, b) => b.price - a.price)} type="bids" />
      <p className="book-footnote">Depth is synthetic. Your own resting orders appear separately and are not executable against yourself.</p>
    </section>
  );
}
