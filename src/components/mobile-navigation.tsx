"use client";

import Link from "next/link";
import { BarChart3, Compass, Layers3, Search, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Discover", icon: Compass },
  { href: "/markets", label: "Markets", icon: Search },
  { href: "/portfolio", label: "Portfolio", icon: Layers3 },
  { href: "/leaderboard", label: "Ranks", icon: BarChart3 },
  { href: "/settings", label: "Account", icon: UserRound }
];

export function MobileNavigation() {
  const pathname = usePathname();
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return <Link className={active ? "active" : ""} href={href} key={href}><Icon size={19} /><span>{label}</span></Link>;
      })}
    </nav>
  );
}
