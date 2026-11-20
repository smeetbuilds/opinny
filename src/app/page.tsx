import { SiteShell } from "@/components/site-shell";
import { HomeDashboard } from "@/components/home-dashboard";
import { dataAdapter } from "@/lib/data";

export default async function HomePage() {
  const [markets, leaderboard] = await Promise.all([
    dataAdapter.listMarkets({ sort: "trending" }),
    dataAdapter.getLeaderboard()
  ]);
  return <SiteShell><HomeDashboard initialMarkets={markets} leaderboard={leaderboard} /></SiteShell>;
}
