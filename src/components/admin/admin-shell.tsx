"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, BarChart3, CircleDollarSign, Gauge, Menu, Settings, ShieldCheck, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";

const links = [
  { href: "/admin", label: "Overview", icon: Gauge },
  { href: "/admin/markets", label: "Markets", icon: BarChart3 },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/resolutions", label: "Resolutions", icon: ShieldCheck },
  { href: "/admin/transactions", label: "Transactions", icon: CircleDollarSign },
  { href: "/admin/settings", label: "Settings", icon: Settings }
];

export function AdminShell({ title, description, actions, children }: { title: string; description?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", close);
    };
  }, [mobileOpen]);

  const sidebar = (
    <aside className="admin-sidebar" aria-label="Administration">
      <div className="admin-brand"><Logo /><span>Admin</span></div>
      <nav aria-label="Admin navigation">{links.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return <Link className={active ? "active" : ""} aria-current={active ? "page" : undefined} href={href} key={href} onClick={() => setMobileOpen(false)}><Icon size={17} /><span>{label}</span></Link>;
      })}</nav>
      <div className="admin-sidebar-foot">
        <Link href="/"><ArrowLeft size={16} />Back to platform</Link>
        <div><span className="profile-avatar">PA</span><span><strong>Platform Admin</strong><small>Administrator</small></span></div>
      </div>
    </aside>
  );

  return (
    <div className="admin-shell">
      <a className="skip-link" href="#admin-main-content">Skip to admin content</a>
      {sidebar}
      <div className="admin-main">
        <header className="admin-topbar">
          <button className="icon-button admin-menu-button" type="button" aria-label="Open admin navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
          <div className="admin-heading"><span className="eyebrow">Operations</span><h1>{title}</h1>{description ? <p>{description}</p> : null}</div>
          {actions ? <div className="page-actions">{actions}</div> : null}
          <div className="admin-health" role="status"><i /><span><strong>All systems operational</strong><small>Mock adapter · healthy</small></span></div>
        </header>
        <main className="admin-content" id="admin-main-content" tabIndex={-1}>{children}</main>
      </div>
      {mobileOpen ? (
        <div className="mobile-drawer-wrap admin-mobile-wrap">
          <button className="drawer-backdrop" type="button" aria-label="Close admin navigation" onClick={() => setMobileOpen(false)} />
          <div className="admin-mobile-sidebar" role="dialog" aria-modal="true" aria-label="Admin navigation">
            <button className="icon-button close-admin-mobile" type="button" aria-label="Close admin navigation" onClick={() => setMobileOpen(false)}><X size={18} /></button>
            {sidebar}
          </div>
        </div>
      ) : null}
    </div>
  );
}
