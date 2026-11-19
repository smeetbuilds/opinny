"use client";

import { ArrowUpRight, ShieldAlert, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import type { AdminAnalytics, AdminMetric } from "@/core/contracts/domain";
import { dataAdapter } from "@/lib/data";
import { CategoryBreakdown, VolumeChart } from "./admin-charts";

export function AdminOverviewLive({ initialMetrics, initialAnalytics }: { initialMetrics: AdminMetric[]; initialAnalytics: AdminAnalytics }) {
  const [snapshot, setSnapshot] = useState({ metrics: initialMetrics, analytics: initialAnalytics });
  useEffect(() => {
    let mounted = true;
    const refresh = () => {
      void Promise.all([dataAdapter.getMetrics(), dataAdapter.getAnalytics()]).then(([metrics, analytics]) => {
        if (mounted) setSnapshot({ metrics, analytics });
      }).catch(() => {});
    };
    refresh();
    window.addEventListener("opinny:paper-update", refresh);
    return () => { mounted = false; window.removeEventListener("opinny:paper-update", refresh); };
  }, []);
  const { metrics, analytics } = snapshot;
  return (
    <>
      <div className="admin-metric-grid">{metrics.map((metric, index) => (
        <article key={metric.label}>
          <div><span>{metric.label}</span>{index === 2 ? <UsersRound size={18} /> : index === 3 ? <ShieldAlert size={18} /> : <ArrowUpRight size={18} />}</div>
          <strong>{metric.value}</strong>
          <em className={metric.change >= 0 ? "positive" : "negative"}>{metric.change >= 0 ? "+" : ""}{metric.change}% <small>vs prior period</small></em>
          <small>{metric.hint}</small>
        </article>
      ))}</div>
      <div className="admin-dashboard-grid"><VolumeChart analytics={analytics} changePercent={metrics[0]?.change ?? 0} /><CategoryBreakdown analytics={analytics} /></div>
    </>
  );
}
