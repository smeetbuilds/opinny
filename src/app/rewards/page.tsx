import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { RewardsConsole } from "@/components/rewards-console";
import { dataAdapter } from "@/lib/data";

export const metadata: Metadata = {
  title: "Rewards",
  description: "Explore liquidity incentive opportunities for competitive limit orders."
};

export default async function RewardsPage() {
  const opportunities = await dataAdapter.getRewardOpportunities();

  return (
    <SiteShell>
      <div className="page-container inner-page rewards-page">
        <RewardsConsole initialRewards={opportunities} />
      </div>
    </SiteShell>
  );
}
