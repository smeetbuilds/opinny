"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Menu, Search, Wallet, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Logo } from "./logo";
import { NotificationCenter } from "./notification-center";
import { useApp } from "./app-provider";
import { shortAddress } from "@/lib/format";

const navItems = [
  { href: "/markets", label: "Markets" },
  { href: "/rewards", label: "Rewards" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/leaderboard", label: "Leaderboard" }
];

const drawerItems = [
  ...navItems,
  { href: "/watchlist", label: "Watchlist" },
  { href: "/activity", label: "Activity" },
  { href: "/settings", label: "Settings" },
  { href: "/help", label: "Help centre" }
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { connected, walletAddress, setWalletOpen, disconnectWallet, marketCatalog } = useApp();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [activeResult, setActiveResult] = useState(0);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const source = normalized
      ? marketCatalog.filter((market) => [market.question, market.shortQuestion, market.category, ...market.tags].join(" ").toLowerCase().includes(normalized))
      : [...marketCatalog].sort((a, b) => b.volume24h - a.volume24h);
    return source.slice(0, 6);
  }, [marketCatalog, query]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQuery("");
    setActiveResult(0);
  }, []);

  const openMarket = useCallback((slug: string) => {
    router.push(`/market/${slug}`);
    closeSearch();
  }, [closeSearch, router]);

  useEffect(() => setActiveResult(0), [query]);
  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!searchOpen && !menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [searchOpen, menuOpen]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (event.key === "Escape") {
        if (searchOpen) closeSearch();
        setMenuOpen(false);
        setAccountOpen(false);
        return;
      }
      if (!searchOpen || results.length === 0) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveResult((index) => (index + 1) % results.length);
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveResult((index) => (index - 1 + results.length) % results.length);
      }
      if (event.key === "Enter") {
        event.preventDefault();
        openMarket(results[activeResult]?.slug ?? results[0].slug);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeResult, closeSearch, openMarket, results, searchOpen]);

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Logo />
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navItems.map((item) => <Link className={pathname.startsWith(item.href) ? "active" : ""} href={item.href} key={item.href}>{item.label}</Link>)}
          </nav>
          <button className="search-trigger" onClick={() => setSearchOpen(true)} aria-label="Search markets">
            <Search size={17} /><span>Search markets</span><kbd>⌘ K</kbd>
          </button>
          <div className="topbar-actions">
            <NotificationCenter />
            {connected ? (
              <div className="account-control">
                <button className="account-button" onClick={() => setAccountOpen((open) => !open)} aria-expanded={accountOpen} aria-haspopup="menu">
                  <span className="status-dot" /><span>{shortAddress(walletAddress)}</span><ChevronDown className={accountOpen ? "rotated" : ""} size={15} />
                </button>
                {accountOpen ? (
                  <div className="account-menu" role="menu">
                    <Link href="/portfolio" role="menuitem" onClick={() => setAccountOpen(false)}>Portfolio</Link>
                    <Link href="/orders" role="menuitem" onClick={() => setAccountOpen(false)}>Orders</Link>
                    <Link href="/settings" role="menuitem" onClick={() => setAccountOpen(false)}>Settings</Link>
                    <button role="menuitem" onClick={() => { disconnectWallet(); setAccountOpen(false); }}>Disconnect</button>
                  </div>
                ) : null}
              </div>
            ) : <button className="primary-button compact" onClick={() => setWalletOpen(true)}><Wallet size={16} />Connect wallet</button>}
            <button className="icon-button mobile-menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen}><Menu size={20} /></button>
          </div>
        </div>
      </header>

      {searchOpen ? (
        <div className="overlay search-overlay" onMouseDown={closeSearch}>
          <div className="command-dialog" role="dialog" aria-modal="true" aria-label="Search markets" onMouseDown={(event) => event.stopPropagation()}>
            <div className="command-input-wrap">
              <Search size={20} />
              <input autoFocus placeholder="Search questions, categories or tags" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search markets" />
              {query ? <button className="clear-search" aria-label="Clear search" onClick={() => setQuery("")}><X size={15} /></button> : null}
              <button className="icon-button" aria-label="Close search" onClick={closeSearch}><X size={17} /></button>
            </div>
            <div className="command-results" role="listbox" aria-label="Market search results">
              <div className="command-results-head"><span className="command-label">{query ? "Matching markets" : "Trending now"}</span><small>{results.length} shown</small></div>
              {results.map((market, index) => (
                <button className={index === activeResult ? "active" : ""} role="option" aria-selected={index === activeResult} key={market.id} onMouseEnter={() => setActiveResult(index)} onClick={() => openMarket(market.slug)}>
                  <span className={`market-avatar ${market.imageTone}`}>{market.icon}</span>
                  <span><strong>{market.shortQuestion}</strong><small>{market.category} · {market.status === "open" ? `$${Math.round(market.volume24h / 1000)}K today` : market.status}</small></span>
                  <em>{market.outcomes[0].probability}%</em>
                </button>
              ))}
              {results.length === 0 ? <div className="command-empty"><Search size={22} /><strong>No markets found</strong><span>Try a category, topic or shorter keyword.</span></div> : null}
            </div>
            <footer className="command-footer"><span>↑↓ Navigate</span><span>↵ Open</span><span>Esc Close</span></footer>
          </div>
        </div>
      ) : null}

      {menuOpen ? (
        <div className="mobile-drawer-wrap">
          <button className="drawer-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
          <aside className="mobile-drawer" aria-label="Mobile menu">
            <div className="mobile-drawer-head"><Logo /><button className="icon-button" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X size={19} /></button></div>
            <button className="drawer-search" onClick={() => { setMenuOpen(false); setSearchOpen(true); }}><Search size={18} />Search markets <kbd>⌘ K</kbd></button>
            <nav aria-label="Mobile primary navigation">
              {drawerItems.map((item) => <Link className={pathname.startsWith(item.href) ? "active" : ""} href={item.href} key={item.href} onClick={() => setMenuOpen(false)}>{item.label}</Link>)}
            </nav>
            <div className="drawer-spacer" />
            <Link className="admin-link" href="/admin" onClick={() => setMenuOpen(false)}>Admin interface</Link>
          </aside>
        </div>
      ) : null}
    </>
  );
}
