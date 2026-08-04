"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, Menu, Search, Wallet, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "./logo";
import { useApp } from "./app-provider";
import { shortAddress } from "@/lib/format";
import { markets } from "@/adapters/mock/data";

const navItems = [
  { href: "/markets", label: "Markets" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/leaderboard", label: "Leaderboard" }
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { connected, walletAddress, setWalletOpen, disconnectWallet } = useApp();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const results = markets.filter((market) =>
    [market.question, market.category, ...market.tags].join(" ").toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Logo />
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navItems.map((item) => (
              <Link className={pathname.startsWith(item.href) ? "active" : ""} href={item.href} key={item.href}>{item.label}</Link>
            ))}
          </nav>
          <button className="search-trigger" onClick={() => setSearchOpen(true)}>
            <Search size={17} /><span>Search markets</span><kbd>⌘K</kbd>
          </button>
          <div className="topbar-actions">
            <button className="icon-button desktop-only" aria-label="Notifications"><Bell size={18} /></button>
            {connected ? (
              <div className="account-control">
                <button className="account-button" onClick={() => setAccountOpen((open) => !open)}>
                  <span className="status-dot" />
                  <span>{shortAddress(walletAddress)}</span>
                  <ChevronDown size={15} />
                </button>
                {accountOpen ? (
                  <div className="account-menu">
                    <Link href="/portfolio" onClick={() => setAccountOpen(false)}>Portfolio</Link>
                    <Link href="/orders" onClick={() => setAccountOpen(false)}>Orders</Link>
                    <Link href="/settings" onClick={() => setAccountOpen(false)}>Settings</Link>
                    <button onClick={() => { disconnectWallet(); setAccountOpen(false); }}>Disconnect</button>
                  </div>
                ) : null}
              </div>
            ) : (
              <button className="primary-button compact" onClick={() => setWalletOpen(true)}><Wallet size={16} />Connect</button>
            )}
            <button className="icon-button mobile-menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          </div>
        </div>
      </header>

      {searchOpen ? (
        <div className="overlay search-overlay" onMouseDown={() => setSearchOpen(false)}>
          <div className="command-dialog" role="dialog" aria-modal="true" aria-label="Search markets" onMouseDown={(event) => event.stopPropagation()}>
            <div className="command-input-wrap">
              <Search size={20} />
              <input autoFocus placeholder="Search questions, categories or tags" value={query} onChange={(event) => setQuery(event.target.value)} />
              <button className="icon-button" aria-label="Close search" onClick={() => setSearchOpen(false)}><X size={17} /></button>
            </div>
            <div className="command-results">
              <span className="command-label">{query ? "Results" : "Trending now"}</span>
              {results.map((market) => (
                <button key={market.id} onClick={() => { router.push(`/market/${market.slug}`); setSearchOpen(false); setQuery(""); }}>
                  <span className={`market-avatar ${market.imageTone}`}>{market.icon}</span>
                  <span><strong>{market.shortQuestion}</strong><small>{market.category} · ${Math.round(market.volume24h / 1000)}K today</small></span>
                  <em>{market.outcomes[0].probability}%</em>
                </button>
              ))}
            </div>
            <footer className="command-footer"><span>↑↓ Navigate</span><span>↵ Open</span><span>Esc Close</span></footer>
          </div>
        </div>
      ) : null}

      {menuOpen ? (
        <div className="mobile-drawer-wrap">
          <button className="drawer-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          <aside className="mobile-drawer">
            <div className="mobile-drawer-head"><Logo /><button className="icon-button" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X size={19} /></button></div>
            <button className="drawer-search" onClick={() => { setMenuOpen(false); setSearchOpen(true); }}><Search size={18} />Search markets</button>
            <nav>
              {[...navItems, { href: "/watchlist", label: "Watchlist" }, { href: "/activity", label: "Activity" }, { href: "/settings", label: "Settings" }].map((item) => (
                <Link href={item.href} key={item.href} onClick={() => setMenuOpen(false)}>{item.label}</Link>
              ))}
            </nav>
            <div className="drawer-spacer" />
            <Link className="admin-link" href="/admin" onClick={() => setMenuOpen(false)}>Admin interface</Link>
          </aside>
        </div>
      ) : null}
    </>
  );
}
