import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { AccountShell } from "@/components/account-shell";
import { FundingButtons } from "@/components/funding-buttons";
import { PortfolioConsole } from "@/components/portfolio-console";
import { dataAdapter } from "@/lib/data";

export const metadata: Metadata = { title: "Portfolio" };

export default async function PortfolioPage() {
  const positions = await dataAdapter.getPositions();
  return <SiteShell><div className="page-container inner-page"><AccountShell title="Portfolio" eyebrow="Your account" description="Track active positions, available crypto collateral and resolved payouts." actions={<FundingButtons />}><PortfolioConsole positions={positions} /></AccountShell></div></SiteShell>;
}
