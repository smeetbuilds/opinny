"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Bookmark, ListOrdered, PieChart, Settings2 } from "lucide-react";

const links = [
  { href: "/portfolio", label: "Portfolio", icon: PieChart },
  { href: "/orders", label: "Orders", icon: ListOrdered },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/watchlist", label: "Watchlist", icon: Bookmark },
  { href: "/settings", label: "Settings", icon: Settings2 }
];

export function AccountShell({ title, eyebrow, description, actions, children }: { title: string; eyebrow?: string; description?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="account-layout">
      <aside className="account-sidebar">
        <div className="account-summary"><span className="profile-avatar large-avatar">MP</span><div><strong>Market Pilot</strong><span>0x19B6…7A42</span></div></div>
        <div className="account-balance"><span>Available to trade</span><strong>$3,842.16</strong><small><i /> Wallet connected</small></div>
        <nav aria-label="Account navigation">{links.map(({ href, label, icon: Icon }) => <Link className={pathname.startsWith(href) ? "active" : ""} href={href} key={href}><Icon size={17} /><span>{label}</span></Link>)}</nav>
      </aside>
      <section className="account-content">
        <header className="account-page-head"><div>{eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}<h1>{title}</h1>{description ? <p>{description}</p> : null}</div>{actions ? <div className="page-actions">{actions}</div> : null}</header>
        <nav className="account-tabs-mobile" aria-label="Account sections">{links.map(({ href, label }) => <Link className={pathname.startsWith(href) ? "active" : ""} href={href} key={href}>{label}</Link>)}</nav>
        {children}
      </section>
    </div>
  );
}
