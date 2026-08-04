import type { OrderBookLevel } from "@/core/contracts/domain";
import { formatNumber } from "@/lib/format";

function Side({ levels, type }: { levels: OrderBookLevel[]; type: "asks" | "bids" }) {
  const max = Math.max(1, ...levels.map((level) => level.total));

  if (!levels.length) {
    return <div className="book-empty">No {type === "asks" ? "sell" : "buy"} liquidity yet.</div>;
  }

  return (
    <div className={`book-side ${type}`} aria-label={type === "asks" ? "Sell orders" : "Buy orders"}>
      {levels.map((level) => (
        <div className="book-row" key={`${type}-${level.price}`} aria-label={`${Math.round(level.price * 100)} cents, ${formatNumber(level.size)} shares, ${formatNumber(level.total)} total`}>
          <i style={{ width: `${(level.total / max) * 100}%` }} />
          <span data-label="Price">{Math.round(level.price * 100)}¢</span>
          <span data-label="Size">{formatNumber(level.size)}</span>
          <span data-label="Total">{formatNumber(level.total)}</span>
        </div>
      ))}
    </div>
  );
}

export function OrderBook({ bids, asks }: { bids: OrderBookLevel[]; asks: OrderBookLevel[] }) {
  const bestBid = bids.length ? Math.max(...bids.map((level) => level.price)) : 0;
  const bestAsk = asks.length ? Math.min(...asks.map((level) => level.price)) : 0;
  const spread = bestBid && bestAsk ? Math.max(bestAsk - bestBid, 0) : 0;
  const midpoint = bestBid && bestAsk ? (bestBid + bestAsk) / 2 : bestBid || bestAsk;
  const spreadPercent = midpoint ? (spread / midpoint) * 100 : 0;

  return (
    <section className="book-card" aria-labelledby="order-book-title">
      <div className="book-head">
        <div><h3 id="order-book-title">Order book</h3><span><i />Live market depth</span></div>
        <div className="book-legend" aria-hidden="true"><span>Price</span><span>Size</span><span>Total</span></div>
      </div>
      <div className="book-quote-strip">
        <span><small>Best bid</small><strong>{bestBid ? `${Math.round(bestBid * 100)}¢` : "—"}</strong></span>
        <span><small>Midpoint</small><strong>{midpoint ? `${Math.round(midpoint * 100)}¢` : "—"}</strong></span>
        <span><small>Best ask</small><strong>{bestAsk ? `${Math.round(bestAsk * 100)}¢` : "—"}</strong></span>
      </div>
      <Side levels={[...asks].sort((a, b) => b.price - a.price)} type="asks" />
      <div className="book-spread">
        <span>Bid–ask spread</span>
        <strong>{spread ? `${Math.round(spread * 100)}¢` : "—"}</strong>
        <em>{spread ? `${spreadPercent.toFixed(1)}%` : "Waiting for both sides"}</em>
      </div>
      <Side levels={[...bids].sort((a, b) => b.price - a.price)} type="bids" />
    </section>
  );
}
