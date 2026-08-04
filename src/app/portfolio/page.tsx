import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CircleDollarSign, Target, TrendingUp, WalletCards } from "lucide-react";
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
  const invested = Math.max(value - pnl, 0);
  const returnPercent = invested ? (pnl / invested) * 100 : 0;
  const profitable = positions.filter((position) => position.pnl >= 0).length;

  return (
    <SiteShell>
      <div className="page-container inner-page">
        <AccountShell title="Portfolio" eyebrow="Your account" description="Track active positions, available collateral and performance." actions={<FundingButtons />}>
          <div className="portfolio-summary-grid">
            <article className="balance-card featured-balance">
              <div><span>Portfolio value</span><strong>{formatCurrency(value + 3842.16)}</strong><em className={pnl >= 0 ? "positive" : "negative"}>{pnl >= 0 ? "+" : ""}{formatCurrency(pnl)} all time · {returnPercent.toFixed(1)}%</em></div>
              <div className="mini-chart" aria-label="Portfolio value trend"><svg viewBox="0 0 240 76" preserveAspectRatio="none"><polyline points="0,65 24,58 48,61 72,46 96,50 120,38 144,42 168,29 192,34 216,19 240,12" /></svg></div>
            </article>
            <article className="balance-card"><CircleDollarSign size={18} /><span>Available collateral</span><strong>$3,842.16</strong><small>USDC ready to deploy</small></article>
            <article className="balance-card"><TrendingUp size={18} /><span>Open positions</span><strong>{positions.length}</strong><small>{formatCurrency(value)} market value</small></article>
            <article className="balance-card"><WalletCards size={18} /><span>Claimable</span><strong>$486.00</strong><small>1 resolved position</small></article>
          </div>

          <div className="portfolio-health-strip">
            <span><Target size={16} /><small>Positions in profit</small><strong>{profitable} of {positions.length}</strong></span>
            <span><TrendingUp size={16} /><small>Net return</small><strong className={returnPercent >= 0 ? "positive" : "negative"}>{returnPercent >= 0 ? "+" : ""}{returnPercent.toFixed(1)}%</strong></span>
            <span><CircleDollarSign size={16} /><small>Capital deployed</small><strong>{formatCurrency(invested)}</strong></span>
            <Link href="/markets">Find opportunities <ArrowUpRight size={14} /></Link>
          </div>

          <section className="data-panel" aria-labelledby="positions-title">
            <div className="table-title">
              <div><h2 id="positions-title">Open positions</h2><span>{positions.length} active markets · Updated with current probabilities</span></div>
              <Link className="panel-link" href="/markets">Browse markets <ArrowUpRight size={14} /></Link>
            </div>
            <div className="responsive-table account-data-table">
              <table>
                <thead><tr><th>Market</th><th>Outcome</th><th>Shares</th><th>Avg. price</th><th>Current</th><th>Value</th><th>P&amp;L</th><th /></tr></thead>
                <tbody>{positions.map((position) => (
                  <tr key={position.id}>
                    <td className="wide-cell" data-label="Market"><Link href={`/market/${position.marketSlug}`}>{position.marketQuestion}<small>Position {position.id}</small></Link></td>
                    <td data-label="Outcome"><span className="outcome-chip">{position.outcome}</span></td>
                    <td data-label="Shares">{position.shares.toLocaleString()}</td>
                    <td data-label="Avg. price">{Math.round(position.averagePrice * 100)}¢</td>
                    <td data-label="Current">{Math.round(position.currentPrice * 100)}¢</td>
                    <td data-label="Value">{formatCurrency(position.value)}</td>
                    <td data-label="P&amp;L"><span className={position.pnl >= 0 ? "positive" : "negative"}>{position.pnl >= 0 ? "+" : ""}{formatCurrency(position.pnl)}<small>{position.pnlPercent.toFixed(1)}%</small></span></td>
                    <td><Link className="row-action" href={`/market/${position.marketSlug}`}>Trade <ArrowUpRight size={14} /></Link></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </section>
        </AccountShell>
      </div>
    </SiteShell>
  );
}
