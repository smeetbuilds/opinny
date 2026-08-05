import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/site-shell";
import { TraderProfile } from "@/components/trader-profile";
import { dataAdapter } from "@/lib/data";

export const dynamicParams = false;

export async function generateStaticParams() {
  const entries = await dataAdapter.getLeaderboard();
  return entries.map((entry) => ({ handle: entry.handle }));
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const entries = await dataAdapter.getLeaderboard();
  const profile = entries.find((entry) => entry.handle === handle);
  return profile ? { title: profile.displayName, description: profile.bio } : { title: "Trader profile" };
}

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [entries, markets, activity] = await Promise.all([dataAdapter.getLeaderboard(), dataAdapter.listMarkets(), dataAdapter.getActivity()]);
  const profile = entries.find((entry) => entry.handle === handle);
  if (!profile) notFound();
  return <SiteShell><div className="page-container inner-page"><TraderProfile profile={profile} markets={markets} activity={activity} /></div></SiteShell>;
}
