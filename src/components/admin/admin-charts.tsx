"use client";

import { useId } from "react";
import type { AdminAnalytics } from "@/core/contracts/domain";
import { formatCurrency } from "@/lib/format";

export function VolumeChart({ analytics, changePercent }: { analytics: AdminAnalytics; changePercent: number }) {
  const values = analytics.volumeSeries.length ? analytics.volumeSeries : [0];
  const maxValue = Math.max(...values, 1);
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 800},${220 - (value / maxValue) * 200}`).join(" ");
  const gradientId = `admin-area-${useId().replaceAll(":", "")}`;

  return (
    <section className="admin-chart" aria-labelledby="admin-volume-title">
      <div className="admin-chart-head">
        <div><h2 id="admin-volume-title">Trading volume</h2><span>Daily settled notional · Last 30 days</span></div>
        <div><strong>{formatCurrency(analytics.volumeTotal, { compact: true, maximumFractionDigits: 2 })}</strong><em>{changePercent >= 0 ? "+" : ""}{changePercent.toFixed(1)}%</em></div>
      </div>
      <div className="admin-chart-summary"><span><small>Daily average</small><strong>{formatCurrency(analytics.dailyAverage, { compact: true, maximumFractionDigits: 0 })}</strong></span><span><small>Peak day</small><strong>{formatCurrency(analytics.peakDay, { compact: true, maximumFractionDigits: 0 })}</strong></span><span><small>Settlement rate</small><strong>{analytics.settlementRate.toFixed(1)}%</strong></span></div>
      <div className="admin-chart-canvas">
        <div className="admin-y-axis"><span>{formatCurrency(analytics.peakDay, { compact: true, maximumFractionDigits: 0 })}</span><span>{formatCurrency(analytics.peakDay / 2, { compact: true, maximumFractionDigits: 0 })}</span><span>$0</span></div>
        <svg viewBox="0 0 800 230" preserveAspectRatio="none" role="img" aria-label="Thirty day trading volume trend">
          <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".18" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
          <line x1="0" y1="55" x2="800" y2="55" /><line x1="0" y1="110" x2="800" y2="110" /><line x1="0" y1="165" x2="800" y2="165" />
          <polygon points={`0,230 ${points} 800,230`} fill={`url(#${gradientId})`} /><polyline points={points} />
        </svg>
      </div>
      <div className="admin-chart-axis"><span>Jul 6</span><span>Jul 13</span><span>Jul 20</span><span>Jul 27</span><span>Aug 4</span></div>
    </section>
  );
}

export function CategoryBreakdown({ analytics }: { analytics: AdminAnalytics }) {
  return (
    <section className="category-breakdown" aria-labelledby="category-volume-title">
      <div className="table-title"><div><h2 id="category-volume-title">Volume by category</h2><span>Trailing 30 days</span></div></div>
      <div className="donut-wrap">
        <div className="donut-chart" role="img" aria-label={`Category distribution: ${analytics.categories.map((row) => `${row.label} ${row.value} percent`).join(", ")}`}><span><strong>{formatCurrency(analytics.categoryTotal, { compact: true, maximumFractionDigits: 1 })}</strong><small>Total</small></span></div>
        <div className="donut-legend">{analytics.categories.map((row, index) => <div key={row.label}><i className={`dot-${index + 1}`} /><span>{row.label}<b><em style={{ width: `${row.value}%` }} /></b></span><strong>{row.value}%</strong></div>)}</div>
      </div>
    </section>
  );
}
