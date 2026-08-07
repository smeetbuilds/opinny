"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Market } from "@/core/contracts/domain";
import { CategoryTabs } from "./category-tabs";
import { MarketCard } from "./market-card";

export function MarketGrid({
  initialMarkets,
  heading = "Markets",
  showCategories = true,
  syncCategoryFromUrl = false
}: {
  initialMarkets: Market[];
  heading?: string;
  showCategories?: boolean;
  syncCategoryFromUrl?: boolean;
}) {
  const categories = useMemo(() => ["All", ...Array.from(new Set(initialMarkets.map((market) => market.category))).sort()], [initialMarkets]);
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("trending");
  const [openOnly, setOpenOnly] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!syncCategoryFromUrl) return;

    const readCategory = () => {
      const requested = new URLSearchParams(window.location.search).get("category");
      if (requested && categories.includes(requested)) setCategory(requested);
      else setCategory("All");
    };

    readCategory();
    window.addEventListener("popstate", readCategory);
    return () => window.removeEventListener("popstate", readCategory);
  }, [categories, syncCategoryFromUrl]);

  const visible = useMemo(() => {
    let result = [...initialMarkets];
    const normalized = query.trim().toLowerCase();
    if (normalized) result = result.filter((market) => [market.question, market.shortQuestion, market.category, ...market.tags].join(" ").toLowerCase().includes(normalized));
    if (category !== "All") result = result.filter((market) => market.category === category);
    if (openOnly) result = result.filter((market) => market.status === "open");
    if (sort === "volume") result.sort((a, b) => b.volume - a.volume);
    if (sort === "newest") result.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (sort === "ending") result.sort((a, b) => +new Date(a.endDate) - +new Date(b.endDate));
    if (sort === "trending") result.sort((a, b) => b.volume24h - a.volume24h);
    return result;
  }, [initialMarkets, category, sort, openOnly, query]);

  function changeCategory(nextCategory: string) {
    setCategory(nextCategory);
    if (!syncCategoryFromUrl) return;
    const url = new URL(window.location.href);
    if (nextCategory === "All") url.searchParams.delete("category");
    else url.searchParams.set("category", nextCategory);
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }

  const hasActiveFilters = category !== "All" || sort !== "trending" || !openOnly || Boolean(query.trim());
  const clearFilters = () => {
    changeCategory("All");
    setSort("trending");
    setOpenOnly(true);
    setQuery("");
  };

  return (
    <section className="market-grid-section">
      <div className="section-heading-row">
        <div><span className="eyebrow">Explore</span><h2>{heading}</h2></div>
        <div className="market-controls">
          <label className="toggle-control"><input type="checkbox" checked={openOnly} onChange={(event) => setOpenOnly(event.target.checked)} /><span />Open only</label>
          <label className="select-control"><SlidersHorizontal size={15} /><select aria-label="Sort markets" value={sort} onChange={(event) => setSort(event.target.value)}><option value="trending">Trending</option><option value="volume">Volume</option><option value="newest">Newest</option><option value="ending">Ending soon</option></select></label>
        </div>
      </div>
      <div className="market-discovery-bar">
        <label className="market-search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search within markets" aria-label="Search within markets" />{query ? <button onClick={() => setQuery("")} aria-label="Clear market search"><X size={14} /></button> : null}</label>
        <div className="market-results-meta" aria-live="polite"><strong>{visible.length}</strong><span>{visible.length === 1 ? "market" : "markets"}</span>{hasActiveFilters ? <button onClick={clearFilters}>Reset filters</button> : null}</div>
      </div>
      {showCategories ? <CategoryTabs categories={categories} active={category} onChange={changeCategory} /> : null}
      <div className="market-grid">{visible.map((market) => <MarketCard market={market} key={market.id} />)}</div>
      {visible.length === 0 ? <div className="empty-state market-empty"><Search size={24} /><strong>No markets match these filters.</strong><span>Try another category, remove a keyword or include resolved markets.</span><button className="secondary-button compact" onClick={clearFilters}>Clear all filters</button></div> : null}
    </section>
  );
}
