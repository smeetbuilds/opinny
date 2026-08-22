import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { AccountShell } from "@/components/account-shell";
import { FundingButtons } from "@/components/funding-buttons";
import { PortfolioData } from "@/components/account-data";

export const metadata: Metadata = { title: "Portfolio" };

export default function PortfolioPage() {
  return <SiteShell><div className="page-container inner-page"><AccountShell title="Portfolio" eyebrow="Your account" description="Track active positions, available crypto collateral and resolved payouts." actions={<FundingButtons />}><PortfolioData /></AccountShell></div></SiteShell>;
}
