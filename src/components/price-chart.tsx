"use client";

import { Activity, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useEffect, useId, useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";
import { dataAdapter } from "@/lib/data";

const ranges = ["7 pts", "11 pts", "17 pts", "24 pts", "ALL"] as const;
type Range = (typeof ranges)[number];

const windows: Record<Range, number> = {
  "7 pts": 7,
  "11 pts": 11,
  "17 pts": 17,
  "24 pts": 24,
  ALL: Number.POSITIVE_INFINITY
};

export function PriceChart({ values, marketId }: { values: number[]; marketId?: string }) {
  const [samples, setSamples] = useState(values);
  useEffect(() => {
    if (!marketId) return;
    let mounted = true;
    const refresh = () => {
      void dataAdapter.listMarkets().then((markets) => {
        const found = markets.find((market) => market.id === marketId);
        if (mounted && found) setSamples(found.chart);
      }).catch(() => {});
    };
    refresh();
    window.addEventListener("opinny:paper-update", refresh);
    return () => { mounted = false; window.removeEventListener("opinny:paper-update", refresh); };
  }, [marketId]);
  const [range, setRange] = useState<Range>("24 pts");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const gradientId = `chart-fill-${useId().replaceAll(":", "")}`;

  const chart = useMemo(() => {
    const width = 800;
    const height = 260;
    const visibleValues = samples.slice(-Math.min(samples.length, windows[range]));
    if (!visibleValues.length) {
      return { width, height, values: visibleValues, points: [] as { x: number; y: number; value: number }[], polyline: "", low: 0, high: 0, open: 0, current: 0, axisMin: 0, axisMax: 100 };
    }
    const low = Math.min(...visibleValues);
    const high = Math.max(...visibleValues);
    const min = Math.max(0, low - Math.max((high - low) * 0.18, 3));
    const max = Math.min(100, high + Math.max((high - low) * 0.18, 3));
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
      axisMin: min,
      axisMax: max,
      open: visibleValues[0] ?? 0,
      current: visibleValues.at(-1) ?? 0
    };
  }, [range, samples]);

  const selectedIndex = hoverIndex ?? Math.max(chart.points.length - 1, 0);
  const selectedPoint = chart.points[selectedIndex];
  const inspectWithKeyboard = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const last = chart.points.length - 1;
    let next = selectedIndex;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = Math.max(0, selectedIndex - 1);
    else if (event.key === "ArrowRight" || event.key === "ArrowUp") next = Math.min(last, selectedIndex + 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;
    event.preventDefault();
    setHoverIndex(next);
  };
  const change = chart.current - chart.open;
  const positive = change >= 0;

  const inspect = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!chart.points.length) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(Math.max((event.clientX - rect.left) / Math.max(rect.width, 1), 0), 1);
    setHoverIndex(Math.round(ratio * Math.max(chart.points.length - 1, 0)));
  };

  if (!chart.values.length) {
    return (
      <section className="chart-card" aria-labelledby="probability-chart-title">
        <div className="chart-head"><div><span id="probability-chart-title">Sampled probability</span><strong>—</strong><em>No history available</em></div></div>
        <div className="table-empty large" role="status"><Activity size={22} /><strong>No probability history</strong><span>The connected integration has not supplied chart data for this market.</span></div>
      </section>
    );
  }

  return (
    <section className="chart-card" aria-labelledby="probability-chart-title">
      <div className="chart-head">
        <div>
          <span id="probability-chart-title">Sampled probability</span>
          <strong>{chart.current}%</strong>
          <em className={positive ? "positive" : "negative"}>
            {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {positive ? "+" : ""}{change.toFixed(1)} pts this period
          </em>
        </div>
        <div className="range-tabs" aria-label="Number of recent sampled points">
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
        <span className="chart-live"><Activity size={13} /><small>Market signal</small><strong>Simulated</strong></span>
      </div>

      <div className="chart-area interactive-chart" role="slider" tabIndex={0}
        aria-label="Inspect probability history. Use left and right arrow keys to move between samples."
        aria-valuemin={1} aria-valuemax={chart.points.length} aria-valuenow={selectedIndex + 1}
        aria-valuetext={`Sample ${selectedIndex + 1}: ${selectedPoint?.value ?? chart.current} percent`}
        onKeyDown={inspectWithKeyboard} onBlur={() => setHoverIndex(null)}
        onPointerMove={inspect} onPointerLeave={() => setHoverIndex(null)}>
        <div className="chart-y-axis"><span>{(chart.axisMax - (chart.axisMax - chart.axisMin) * 0.25).toFixed(0)}%</span><span>{((chart.axisMax + chart.axisMin) / 2).toFixed(0)}%</span><span>{(chart.axisMin + (chart.axisMax - chart.axisMin) * 0.25).toFixed(0)}%</span></div>
        <svg viewBox={`0 0 ${chart.width} ${chart.height}`} preserveAspectRatio="none" role="img" aria-label={`Sampled probability history with ${range}. Current probability ${chart.current} percent.`}>
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
