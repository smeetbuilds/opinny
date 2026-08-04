import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CircleDollarSign, TrendingUp, WalletCards } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { AccountShell } from "@/components/account-shell";
import { FundingButtons } from "@/components/funding-buttons";
import { dataAdapter } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

export const metadata: Metadata = { title: "Portfolio" };

export default async function PortfolioPage() {
  const positions = await dataAdapter.getPositions();
  const value = positions.reduce((sum, item) => sum + item.value, 0);
  const pnl = positions.reduce((sum, item) => sum + item.pnl, 0);
  return <SiteShell><div className="page-container inner-page"><AccountShell title="Portfolio" eyebrow="Your account" description="Track active positions, available collateral and performance." actions={<FundingButtons />}>
    <div className="portfolio-summary-grid"><article className="balance-card featured-balance"><div><span>Portfolio value</span><strong>{formatCurrency(value + 3842.16)}</strong><em className="positive">+{formatCurrency(pnl)} all time</em></div><div className="mini-chart"><svg viewBox="0 0 240 76" preserveAspectRatio="none"><polyline points="0,65 24,58 48,61 72,46 96,50 120,38 144,42 168,29 192,34 216,19 240,12" /></svg></div></article><article className="balance-card"><CircleDollarSign size={18} /><span>Available collateral</span><strong>$3,842.16</strong><small>USDC balance</small></article><article className="balance-card"><TrendingUp size={18} /><span>Open positions</span><strong>{positions.length}</strong><small>{formatCurrency(value)} market value</small></article><article className="balance-card"><WalletCards size={18} /><span>Claimable</span><strong>$486.00</strong><small>1 resolved position</small></article></div>
    <section className="data-panel"><div className="table-title"><div><h2>Open positions</h2><span>{positions.length} active markets</span></div><div className="panel-tabs"><button className="active">Active</button><button>Closed</button></div></div><div className="responsive-table"><table><thead><tr><th>Market</th><th>Outcome</th><th>Shares</th><th>Avg. price</th><th>Current</th><th>Value</th><th>P&amp;L</th><th /></tr></thead><tbody>{positions.map((position) => <tr key={position.id}><td className="wide-cell"><Link href={`/market/${position.marketSlug}`}>{position.marketQuestion}</Link></td><td><span className="outcome-chip">{position.outcome}</span></td><td>{position.shares.toLocaleString()}</td><td>{Math.round(position.averagePrice * 100)}¢</td><td>{Math.round(position.currentPrice * 100)}¢</td><td>{formatCurrency(position.value)}</td><td><span className={position.pnl >= 0 ? "positive" : "negative"}>{position.pnl >= 0 ? "+" : ""}{formatCurrency(position.pnl)}<small>{position.pnlPercent.toFixed(1)}%</small></span></td><td><Link className="row-action" href={`/market/${position.marketSlug}`}>Trade <ArrowUpRight size={14} /></Link></td></tr>)}</tbody></table></div></section>
  </AccountShell></div></SiteShell>;
}
