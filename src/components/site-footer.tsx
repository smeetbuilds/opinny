import Link from "next/link";
import { Activity, CircleDollarSign, ShieldCheck } from "lucide-react";
import { Logo } from "./logo";
import { appConfig } from "@/lib/config";

const productLinks = [
  ["Markets", "/markets"],
  ["Portfolio", "/portfolio"],
  ["Orders", "/orders"],
  ["Leaderboard", "/leaderboard"]
] as const;

const accountLinks = [
  ["Activity", "/activity"],
  ["Watchlist", "/watchlist"],
  ["Settings", "/settings"],
  ["Help centre", "/help"]
] as const;

const policyLinks = [
  ["Risk disclosure", "/risk"],
  ["Privacy", "/privacy"],
  ["Terms", "/terms"]
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-container footer-grid">
        <div className="footer-brand">
          <Logo />
          <p>Trade event probabilities through a clean, crypto-only market interface.</p>
          <div className="footer-assurance">
            <span><CircleDollarSign size={14} />Crypto only</span>
            <span><ShieldCheck size={14} />Non-custodial interface</span>
            <span><Activity size={14} />Live market states</span>
          </div>
        </div>
        <nav aria-label="Product links"><strong>Product</strong>{productLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}</nav>
        <nav aria-label="Account links"><strong>Account</strong>{accountLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}</nav>
        <nav aria-label="Policy links"><strong>Information</strong>{policyLinks.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}</nav>
      </div>
      <div className="page-container footer-bottom">
        <span>© {new Date().getFullYear()} {appConfig.name}</span>
        <span>{appConfig.chainName} · {appConfig.supportedAssets.join(" / ")}</span>
        <span>Light interface</span>
      </div>
    </footer>
  );
}
