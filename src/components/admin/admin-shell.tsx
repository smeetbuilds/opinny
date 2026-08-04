"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ArrowLeft, BarChart3, CircleDollarSign, Gauge, Menu, Settings, ShieldCheck, Users, X } from "lucide-react";
import { useState } from "react";
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
  const sidebar = <aside className="admin-sidebar"><div className="admin-brand"><Logo /><span>Admin</span></div><nav>{links.map(({ href, label, icon: Icon }) => { const active = href === "/admin" ? pathname === href : pathname.startsWith(href); return <Link className={active ? "active" : ""} href={href} key={href} onClick={() => setMobileOpen(false)}><Icon size={17} />{label}</Link>; })}</nav><div className="admin-sidebar-foot"><Link href="/"><ArrowLeft size={16} />Back to platform</Link><div><span className="profile-avatar">PA</span><span><strong>Platform Admin</strong><small>Administrator</small></span></div></div></aside>;
  return <div className="admin-shell">{sidebar}<div className="admin-main"><header className="admin-topbar"><button className="icon-button admin-menu-button" onClick={() => setMobileOpen(true)}><Menu size={20} /></button><div><span className="eyebrow">Operations</span><h1>{title}</h1>{description ? <p>{description}</p> : null}</div>{actions ? <div className="page-actions">{actions}</div> : null}<div className="admin-health"><i /><span><strong>All systems operational</strong><small>Mock adapter · healthy</small></span></div></header><main className="admin-content">{children}</main></div>{mobileOpen ? <div className="mobile-drawer-wrap admin-mobile-wrap"><button className="drawer-backdrop" onClick={() => setMobileOpen(false)} /><div className="admin-mobile-sidebar"><button className="icon-button close-admin-mobile" onClick={() => setMobileOpen(false)}><X size={18} /></button>{sidebar}</div></div> : null}</div>;
}
