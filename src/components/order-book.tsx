import type { OrderBookLevel } from "@/core/contracts/domain";
import { formatNumber } from "@/lib/format";

function Side({ levels, type }: { levels: OrderBookLevel[]; type: "asks" | "bids" }) {
  const max = Math.max(...levels.map((level) => level.total));
  return <div className={`book-side ${type}`}>{levels.map((level) => <div className="book-row" key={`${type}-${level.price}`}><i style={{ width: `${(level.total / max) * 100}%` }} /><span>{Math.round(level.price * 100)}¢</span><span>{formatNumber(level.size)}</span><span>{formatNumber(level.total)}</span></div>)}</div>;
}

export function OrderBook({ bids, asks }: { bids: OrderBookLevel[]; asks: OrderBookLevel[] }) {
  return (
    <div className="book-card">
      <div className="book-head"><div><h3>Order book</h3><span>Live depth</span></div><div className="book-legend"><span>Price</span><span>Size</span><span>Total</span></div></div>
      <Side levels={[...asks].reverse()} type="asks" />
      <div className="book-spread"><span>Spread</span><strong>4¢</strong><em>6.3%</em></div>
      <Side levels={bids} type="bids" />
    </div>
  );
}
