import type { Metadata } from "next";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { AccountShell } from "@/components/account-shell";
import { dataAdapter } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  const orders = await dataAdapter.getOrders();
  return <SiteShell><div className="page-container inner-page"><AccountShell title="Orders" eyebrow="Trading" description="Review open, partially filled and historical orders."><section className="data-panel"><div className="table-title"><div><h2>Order history</h2><span>{orders.length} orders</span></div><div className="panel-tabs"><button className="active">All</button><button>Open</button><button>Filled</button><button>Cancelled</button></div></div><div className="responsive-table"><table><thead><tr><th>Market</th><th>Side</th><th>Type</th><th>Price</th><th>Shares</th><th>Filled</th><th>Status</th><th>Date</th><th /></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td className="wide-cell"><Link href={`/market/${order.marketSlug}`}>{order.marketQuestion}<small>{order.outcome}</small></Link></td><td><span className={`side-pill ${order.side}`}>{order.side}</span></td><td className="capitalize">{order.type}</td><td>{Math.round(order.price * 100)}¢</td><td>{order.shares.toLocaleString()}</td><td>{order.filled.toLocaleString()}</td><td><span className={`status-pill ${order.status}`}>{order.status}</span></td><td>{formatDate(order.createdAt)}</td><td><button className="icon-button" aria-label={`Open order actions for ${order.id}`}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div></section></AccountShell></div></SiteShell>;
}
