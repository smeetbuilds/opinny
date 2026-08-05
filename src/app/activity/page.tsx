import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { AccountShell } from "@/components/account-shell";
import { ActivityFeed } from "@/components/activity-feed";
import { dataAdapter } from "@/lib/data";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage() {
  const activity = await dataAdapter.getActivity();
  return <SiteShell><div className="page-container inner-page"><AccountShell title="Activity" eyebrow="Timeline" description="Wallet funding, trades, rewards and market settlements."><ActivityFeed items={activity} /></AccountShell></div></SiteShell>;
}
