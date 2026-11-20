"use client";

import { useEffect, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { dataAdapter } from "@/lib/data";

type Window = "recent" | "all";
const WIDTH = 800;
const HEIGHT = 248;

export function PriceChart({
  values,
  marketId,
  outcomeLabel = "First outcome"
}: {
  values: number[];
  marketId?: string;
  outcomeLabel?: string;
}) {
  const [samples, setSamples] = useState(values);
  const [label, setLabel] = useState(outcomeLabel);
  const [windowSize, setWindowSize] = useState<Window>("all");
  const [inspectedIndex, setInspectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!marketId) return;
    let mounted = true;
    const refresh = () => {
      void dataAdapter.listMarkets().then((markets) => {
        if (!mounted) return;
        const match = markets.find((market) => market.id === marketId);
        if (!match) return;
        setSamples(match.chart);
        setLabel(match.outcomes[0]?.label ?? outcomeLabel);
      }).catch(() => {});
    };
    refresh();
    window.addEventListener("opinny:paper-update", refresh);
    return () => {
      mounted = false;
      window.removeEventListener("opinny:paper-update", refresh);
    };
  }, [marketId, outcomeLabel]);

  const chart = useMemo(() => {
    const readings = windowSize === "recent" ? samples.slice(-6) : samples;
    if (!readings.length) return { readings, low: 0, high: 0, axisMin: 0, axisMax: 100, points: [] as { x: number; y: number; value: number }[], polyline: "" };
    const low = Math.min(...readings);
    const high = Math.max(...readings);
    const pad = Math.max(3, (high - low) * 0.17);
    const axisMin = Math.max(0, Math.floor(low - pad));
    const axisMax = Math.min(100, Math.ceil(high + pad));
    const points = readings.map((value, index) => ({
      x: (index / Math.max(readings.length - 1, 1)) * WIDTH,
      y: HEIGHT - (value - axisMin) / Math.max(axisMax - axisMin, 1) * HEIGHT,
      value
    }));
    return { readings, low, high, axisMin, axisMax, points, polyline: points.map((point) => `${point.x},${point.y}`).join(" ") };
  }, [samples, windowSize]);

  const selectedIndex = inspectedIndex === null ? chart.points.length - 1 : Math.min(inspectedIndex, chart.points.length - 1);
  const selected = chart.points[selectedIndex];
  const start = chart.readings[0] ?? 0;
  const last = chart.readings.at(-1) ?? 0;
  const change = last - start;
  const changeText = `${change >= 0 ? "+" : ""}${change.toFixed(1)} pp`;

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const lastIndex = chart.points.length - 1;
    let next = selectedIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") next = Math.min(lastIndex, selectedIndex + 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = Math.max(0, selectedIndex - 1);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = lastIndex;
    else return;
    event.preventDefault();
    setInspectedIndex(next);
  };

  const inspect = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!chart.points.length) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(rect.width, 1)));
    setInspectedIndex(Math.round(ratio * (chart.points.length - 1)));
  };

  return (
    <section className="chart-card opinny-probability-chart" aria-labelledby="probability-chart-title">
      <header className="chart-head">
        <div className="chart-heading">
          <span className="eyebrow">PROBABILITY TRACE</span>
          <h2 id="probability-chart-title">{label} · sampled history</h2>
          <p>Sequential simulation samples, not a real-time price feed.</p>
        </div>
        <div className="chart-head-reading">
          <strong>{last.toFixed(1)}%</strong>
          <span className={change >= 0 ? "positive" : "negative"}>{changeText} across shown samples</span>
        </div>
      </header>
      <div className="chart-toolbar">
        <div className="chart-sample-summary">
          <span><small>Low</small><strong>{chart.low.toFixed(1)}%</strong></span>
          <span><small>High</small><strong>{chart.high.toFixed(1)}%</strong></span>
          <span><small>Samples</small><strong>{chart.readings.length}</strong></span>
        </div>
        <div className="range-tabs" role="group" aria-label="Probability sample window">
          <button type="button" aria-pressed={windowSize === "recent"} className={windowSize === "recent" ? "active" : ""} onClick={() => { setWindowSize("recent"); setInspectedIndex(null); }}>Recent 6</button>
          <button type="button" aria-pressed={windowSize === "all"} className={windowSize === "all" ? "active" : ""} onClick={() => { setWindowSize("all"); setInspectedIndex(null); }}>All samples</button>
        </div>
      </div>
      {chart.points.length ? (
        <>
          <div className="chart-plot-row">
            <div className="chart-axis-values" aria-hidden="true">
              <span>{chart.axisMax}%</span>
              <span>{((chart.axisMin + chart.axisMax) / 2).toFixed(0)}%</span>
              <span>{chart.axisMin}%</span>
            </div>
            <div
              className="chart-area interactive-chart"
              role="slider"
              tabIndex={0}
              aria-label={`Inspect ${label} probability samples with arrow keys`}
              aria-valuemin={1}
              aria-valuemax={chart.points.length}
              aria-valuenow={selectedIndex + 1}
              aria-valuetext={`Sample ${selectedIndex + 1} of ${chart.points.length}: ${selected?.value ?? last} percent`}
              onKeyDown={onKeyDown}
              onBlur={() => setInspectedIndex(null)}
              onPointerMove={inspect}
              onPointerLeave={() => setInspectedIndex(null)}
            >
              <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
                <line className="grid-line" x1="0" y1="0" x2={WIDTH} y2="0" />
                <line className="grid-line" x1="0" y1={HEIGHT / 2} x2={WIDTH} y2={HEIGHT / 2} />
                <line className="grid-line" x1="0" y1={HEIGHT} x2={WIDTH} y2={HEIGHT} />
                <polyline points={chart.polyline} fill="none" vectorEffect="non-scaling-stroke" />
                {selected && (
                  <>
                    <line className="chart-cursor" x1={selected.x} y1="0" x2={selected.x} y2={HEIGHT} />
                    <circle className="chart-point" cx={selected.x} cy={selected.y} r="4" vectorEffect="non-scaling-stroke" />
                  </>
                )}
              </svg>
              {selected && inspectedIndex !== null ? (
                <div className="chart-tooltip" style={{ left: `${selected.x / WIDTH * 100}%`, top: `${selected.y / HEIGHT * 100}%` }}>
                  <small>Sample {selectedIndex + 1}</small>
                  <strong>{selected.value.toFixed(1)}%</strong>
                </div>
              ) : null}
            </div>
          </div>
          <div className="chart-x-axis"><span>Earlier samples</span><span>Most recent</span></div>
        </>
      ) : <div className="table-empty" role="status"><strong>No sample history</strong><p>Price samples will appear when the simulator has history for this outcome.</p></div>}
      <p className="chart-caption">This trace follows the first listed outcome only. Select a book outcome below to inspect its executable simulated depth.</p>
    </section>
  );
}
