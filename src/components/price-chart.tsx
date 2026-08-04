"use client";

import { Activity, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useId, useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";

const ranges = ["1H", "1D", "1W", "1M", "ALL"] as const;
type Range = (typeof ranges)[number];

const windows: Record<Range, number> = {
  "1H": 7,
  "1D": 11,
  "1W": 17,
  "1M": 24,
  ALL: Number.POSITIVE_INFINITY
};

export function PriceChart({ values }: { values: number[] }) {
  const [range, setRange] = useState<Range>("1M");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const gradientId = `chart-fill-${useId().replaceAll(":", "")}`;

  const chart = useMemo(() => {
    const width = 800;
    const height = 260;
    const visibleValues = values.slice(-Math.min(values.length, windows[range]));
    const low = Math.min(...visibleValues);
    const high = Math.max(...visibleValues);
    const min = low - Math.max((high - low) * 0.18, 3);
    const max = high + Math.max((high - low) * 0.18, 3);
    const points = visibleValues.map((value, index) => {
      const x = (index / Math.max(visibleValues.length - 1, 1)) * width;
      const y = height - ((value - min) / Math.max(max - min, 1)) * height;
      return { x, y, value };
    });
    return {
      width,
      height,
      values: visibleValues,
      points,
      polyline: points.map((point) => `${point.x},${point.y}`).join(" "),
      low,
      high,
      open: visibleValues[0] ?? 0,
      current: visibleValues.at(-1) ?? 0
    };
  }, [range, values]);

  const selectedIndex = hoverIndex ?? Math.max(chart.points.length - 1, 0);
  const selectedPoint = chart.points[selectedIndex];
  const change = chart.current - chart.open;
  const positive = change >= 0;

  const inspect = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((event.clientX - rect.left) / Math.max(rect.width, 1), 0), 1);
    setHoverIndex(Math.round(ratio * Math.max(chart.points.length - 1, 0)));
  };

  return (
    <section className="chart-card" aria-labelledby="probability-chart-title">
      <div className="chart-head">
        <div>
          <span id="probability-chart-title">Implied probability</span>
          <strong>{chart.current}%</strong>
          <em className={positive ? "positive" : "negative"}>
            {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {positive ? "+" : ""}{change.toFixed(1)} pts this period
          </em>
        </div>
        <div className="range-tabs" aria-label="Chart time range">
          {ranges.map((item) => (
            <button
              className={range === item ? "active" : ""}
              type="button"
              aria-pressed={range === item}
              onClick={() => { setRange(item); setHoverIndex(null); }}
              key={item}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-insights">
        <span><small>Open</small><strong>{chart.open}%</strong></span>
        <span><small>Period high</small><strong>{chart.high}%</strong></span>
        <span><small>Period low</small><strong>{chart.low}%</strong></span>
        <span className="chart-live"><Activity size={13} /><small>Market signal</small><strong>Live</strong></span>
      </div>

      <div className="chart-area interactive-chart" onPointerMove={inspect} onPointerLeave={() => setHoverIndex(null)}>
        <div className="chart-y-axis"><span>75%</span><span>50%</span><span>25%</span></div>
        <svg viewBox={`0 0 ${chart.width} ${chart.height}`} preserveAspectRatio="none" role="img" aria-label={`Probability history for ${range}. Current probability ${chart.current} percent.`}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" y1="65" x2="800" y2="65" className="grid-line" />
          <line x1="0" y1="130" x2="800" y2="130" className="grid-line" />
          <line x1="0" y1="195" x2="800" y2="195" className="grid-line" />
          <polygon points={`0,260 ${chart.polyline} 800,260`} fill={`url(#${gradientId})`} />
          <polyline points={chart.polyline} fill="none" vectorEffect="non-scaling-stroke" />
          {selectedPoint ? <>
            <line className="chart-cursor" x1={selectedPoint.x} y1="0" x2={selectedPoint.x} y2="260" />
            <circle className="chart-point" cx={selectedPoint.x} cy={selectedPoint.y} r="5" vectorEffect="non-scaling-stroke" />
          </> : null}
        </svg>
        {selectedPoint ? (
          <div className="chart-tooltip" style={{ left: `${(selectedPoint.x / chart.width) * 100}%`, top: `${(selectedPoint.y / chart.height) * 100}%` }}>
            <small>{hoverIndex === null ? "Latest" : `Point ${selectedIndex + 1}`}</small>
            <strong>{selectedPoint.value}%</strong>
          </div>
        ) : null}
      </div>
      <div className="chart-x-axis"><span>Earlier</span><span>Mid-period</span><span>Recent</span><span>Now</span></div>
    </section>
  );
}
