import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { AccountShell } from "@/components/account-shell";
import { ActivityData } from "@/components/account-data";

export const metadata: Metadata = { title: "Activity" };

export default function ActivityPage() {
  return <SiteShell><div className="page-container inner-page"><AccountShell title="Activity" eyebrow="Timeline" description="Wallet funding, trades, rewards and market settlements."><ActivityData /></AccountShell></div></SiteShell>;
}
