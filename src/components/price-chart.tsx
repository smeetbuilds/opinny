"use client";

import { useMemo, useState } from "react";

const ranges = ["1H", "1D", "1W", "1M", "ALL"];

export function PriceChart({ values }: { values: number[] }) {
  const [range, setRange] = useState("1M");
  const points = useMemo(() => {
    const width = 800;
    const height = 260;
    const min = Math.min(...values) - 4;
    const max = Math.max(...values) + 4;
    return values.map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - ((value - min) / Math.max(max - min, 1)) * height;
      return `${x},${y}`;
    }).join(" ");
  }, [values]);

  return (
    <div className="chart-card">
      <div className="chart-head"><div><span>Implied probability</span><strong>{values.at(-1)}%</strong><em>+4.2 this period</em></div><div className="range-tabs">{ranges.map((item) => <button className={range === item ? "active" : ""} onClick={() => setRange(item)} key={item}>{item}</button>)}</div></div>
      <div className="chart-area">
        <div className="chart-y-axis"><span>75%</span><span>50%</span><span>25%</span></div>
        <svg viewBox="0 0 800 260" preserveAspectRatio="none" role="img" aria-label="Probability price history">
          <defs>
            <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" y1="65" x2="800" y2="65" className="grid-line" />
          <line x1="0" y1="130" x2="800" y2="130" className="grid-line" />
          <line x1="0" y1="195" x2="800" y2="195" className="grid-line" />
          <polygon points={`0,260 ${points} 800,260`} fill="url(#chart-fill)" />
          <polyline points={points} fill="none" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="chart-x-axis"><span>May</span><span>Jun</span><span>Jul</span><span>Now</span></div>
    </div>
  );
}
