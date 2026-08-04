"use client";

import { useId } from "react";

export function VolumeChart() {
  const values = [28, 35, 31, 42, 38, 47, 51, 49, 58, 62, 56, 67, 72, 69, 78, 84, 81, 92, 88, 96, 102, 98, 111, 118, 115, 126, 132, 129, 141, 148];
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 800},${220 - (value / 150) * 200}`).join(" ");
  const gradientId = `admin-area-${useId().replaceAll(":", "")}`;

  return (
    <section className="admin-chart" aria-labelledby="admin-volume-title">
      <div className="admin-chart-head">
        <div><h2 id="admin-volume-title">Trading volume</h2><span>Daily settled notional · Last 30 days</span></div>
        <div><strong>$12.84M</strong><em>+12.8%</em></div>
      </div>
      <div className="admin-chart-summary"><span><small>Daily average</small><strong>$428K</strong></span><span><small>Peak day</small><strong>$512K</strong></span><span><small>Settlement rate</small><strong>99.4%</strong></span></div>
      <div className="admin-chart-canvas">
        <div className="admin-y-axis"><span>$500K</span><span>$250K</span><span>$0</span></div>
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

export function CategoryBreakdown() {
  const rows = [{ label: "Crypto", value: 32 }, { label: "Politics", value: 24 }, { label: "Technology", value: 18 }, { label: "Economy", value: 14 }, { label: "Other", value: 12 }];
  return (
    <section className="category-breakdown" aria-labelledby="category-volume-title">
      <div className="table-title"><div><h2 id="category-volume-title">Volume by category</h2><span>Trailing 30 days</span></div></div>
      <div className="donut-wrap">
        <div className="donut-chart" role="img" aria-label="Category distribution: Crypto 32 percent, Politics 24 percent, Technology 18 percent, Economy 14 percent, Other 12 percent"><span><strong>$48.2M</strong><small>Total</small></span></div>
        <div className="donut-legend">{rows.map((row, index) => <div key={row.label}><i className={`dot-${index + 1}`} /><span>{row.label}<b><em style={{ width: `${row.value}%` }} /></b></span><strong>{row.value}%</strong></div>)}</div>
      </div>
    </section>
  );
}
