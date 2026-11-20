"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Menu, Search, Wallet, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Logo } from "./logo";
import { NotificationCenter } from "./notification-center";
import { useApp } from "./app-provider";
import { shortAddress } from "@/lib/format";
import { appConfig } from "@/lib/config";
import { marketHref } from "@/lib/market-href";

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
  const searchDialogRef = useRef<HTMLDivElement>(null);
  const menuDialogRef = useRef<HTMLElement>(null);
  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const accountTriggerRef = useRef<HTMLButtonElement>(null);
  const accountControlRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const source = normalized
      ? marketCatalog.filter((market) => market.status !== "draft" && [market.question, market.shortQuestion, market.category, ...market.tags].join(" ").toLowerCase().includes(normalized))
      : marketCatalog.filter((market) => market.status !== "draft").sort((a, b) => b.volume24h - a.volume24h);
    return source.slice(0, 6);
  }, [marketCatalog, query]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQuery("");
    setActiveResult(0);
  }, []);

  const openMarket = useCallback((slug: string, marketId: string) => {
    router.push(marketHref(slug, marketId));
    closeSearch();
  }, [closeSearch, router]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMenuOpen(false);
      setAccountOpen(false);
    });
    return () => window.cancelAnimationFrame(frame);
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
        if (accountOpen) accountTriggerRef.current?.focus();
        setAccountOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [accountOpen, closeSearch, searchOpen]);

  useEffect(() => {
    if (!accountOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !accountControlRef.current?.contains(event.target)) setAccountOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [accountOpen]);

  useEffect(() => {
    if (!searchOpen && !menuOpen) return;
    const target = searchOpen ? searchDialogRef.current : menuDialogRef.current;
    const returnFocus = searchOpen
      ? (searchTriggerRef.current?.getClientRects().length ? searchTriggerRef.current : menuTriggerRef.current)
      : menuTriggerRef.current;
    const frame = window.requestAnimationFrame(() => {
      target?.querySelector<HTMLElement>(searchOpen ? 'input[role="combobox"]' : '[aria-label="Close menu"]')?.focus();
    });
    const trapTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const focusable = [...(target?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])];
      if (!focusable.length) { event.preventDefault(); return; }
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", trapTab);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", trapTab);
      if (returnFocus?.getClientRects().length) returnFocus.focus();
    };
  }, [searchOpen, menuOpen]);

  function handleSearchKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveResult((index) => (index + 1) % results.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveResult((index) => (index - 1 + results.length) % results.length);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const market = results[activeResult] ?? results[0];
      openMarket(market.slug, market.id);
    }
  }

  const activeResultId = results[activeResult] ? `market-search-option-${results[activeResult].id}` : undefined;

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Logo />
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navItems.map((item) => <Link className={pathname.startsWith(item.href) ? "active" : ""} href={item.href} key={item.href}>{item.label}</Link>)}
          </nav>
          <button ref={searchTriggerRef} className="search-trigger" onClick={() => setSearchOpen(true)} aria-label="Search markets" aria-haspopup="dialog">
            <Search size={17} /><span>Search markets</span><kbd>⌘ K</kbd>
          </button>
          <div className="topbar-actions">
            <NotificationCenter />
            {connected ? (
              <div className="account-control" ref={accountControlRef}>
                <button ref={accountTriggerRef} className="account-button" aria-label="Account menu" onClick={() => setAccountOpen((open) => !open)} aria-expanded={accountOpen}>
                  <span className="status-dot" /><span>{shortAddress(walletAddress)}</span><ChevronDown className={accountOpen ? "rotated" : ""} size={15} />
                </button>
                {accountOpen ? (
                  <div className="account-menu" role="group" aria-label="Account actions">
                    <Link href="/portfolio" onClick={() => setAccountOpen(false)}>Portfolio</Link>
                    <Link href="/orders" onClick={() => setAccountOpen(false)}>Orders</Link>
                    <Link href="/settings" onClick={() => setAccountOpen(false)}>Settings</Link>
                    <button onClick={() => { void disconnectWallet(); setAccountOpen(false); }}>Disconnect</button>
                  </div>
                ) : null}
              </div>
            ) : <button className="primary-button compact" aria-label={appConfig.adapter === "mock" ? "Start paper trading" : "Connect wallet"} onClick={() => setWalletOpen(true)}><Wallet size={16} /><span className="wallet-button-label">{appConfig.adapter === "mock" ? "Start trading" : "Connect wallet"}</span></button>}
            <button ref={menuTriggerRef} className="icon-button mobile-menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen} aria-haspopup="dialog"><Menu size={20} /></button>
          </div>
        </div>
      </header>

      {searchOpen ? (
        <div className="overlay search-overlay" onMouseDown={closeSearch}>
          <div ref={searchDialogRef} className="command-dialog" role="dialog" aria-modal="true" aria-label="Search markets" onMouseDown={(event) => event.stopPropagation()}>
            <div className="command-input-wrap">
              <Search size={20} />
              <input
                autoFocus
                role="combobox"
                aria-autocomplete="list"
                aria-expanded="true"
                aria-controls="market-search-results"
                aria-activedescendant={activeResultId}
                placeholder="Search questions, categories or tags"
                value={query}
                onChange={(event) => { setQuery(event.target.value); setActiveResult(0); }}
                onKeyDown={handleSearchKeyDown}
                aria-label="Search markets"
              />
              {query ? <button className="clear-search" aria-label="Clear search" onClick={() => { setQuery(""); setActiveResult(0); }}><X size={15} /></button> : null}
              <button className="icon-button" aria-label="Close search" onClick={closeSearch}><X size={17} /></button>
            </div>
            <div className="command-results" id="market-search-results" role="listbox" aria-label="Market search results">
              <div className="command-results-head"><span className="command-label">{query ? "Matching markets" : "Trending now"}</span><small>{results.length} shown</small></div>
              {results.map((market, index) => (
                <button id={`market-search-option-${market.id}`} className={index === activeResult ? "active" : ""} role="option" aria-selected={index === activeResult} key={market.id} onMouseEnter={() => setActiveResult(index)} onClick={() => openMarket(market.slug, market.id)}>
                  <span className="command-market-copy"><strong>{market.shortQuestion}</strong><small>{market.category} · {market.status === "open" ? `${Math.round(market.volume24h / 1000)}K sample 24h` : market.status}</small></span>
                  <em>{Math.max(...market.outcomes.map((outcome) => outcome.probability))}%</em>
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
          <aside ref={menuDialogRef} className="mobile-drawer" role="dialog" aria-modal="true" aria-label="Mobile menu">
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
