import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { LeaderboardBoard } from "@/components/leaderboard-board";
import { dataAdapter } from "@/lib/data";

export const metadata: Metadata = { title: "Leaderboard" };

export default async function LeaderboardPage() {
  const entries = await dataAdapter.getLeaderboard();
  return <SiteShell><div className="page-container inner-page"><LeaderboardBoard entries={entries} /></div></SiteShell>;
}
