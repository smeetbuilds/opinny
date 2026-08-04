"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { Market } from "@/core/contracts/domain";
import { categories } from "@/adapters/mock/data";
import { CategoryTabs } from "./category-tabs";
import { MarketCard } from "./market-card";

export function MarketGrid({ initialMarkets, heading = "Markets", showCategories = true }: { initialMarkets: Market[]; heading?: string; showCategories?: boolean }) {
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("trending");
  const [openOnly, setOpenOnly] = useState(true);

  const visible = useMemo(() => {
    let result = [...initialMarkets];
    if (category !== "All") result = result.filter((market) => market.category === category);
    if (openOnly) result = result.filter((market) => market.status === "open");
    if (sort === "volume") result.sort((a, b) => b.volume - a.volume);
    if (sort === "newest") result.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (sort === "ending") result.sort((a, b) => +new Date(a.endDate) - +new Date(b.endDate));
    if (sort === "trending") result.sort((a, b) => b.volume24h - a.volume24h);
    return result;
  }, [initialMarkets, category, sort, openOnly]);

  return (
    <section className="market-grid-section">
      <div className="section-heading-row">
        <div><span className="eyebrow">Explore</span><h2>{heading}</h2></div>
        <div className="market-controls">
          <label className="toggle-control"><input type="checkbox" checked={openOnly} onChange={(event) => setOpenOnly(event.target.checked)} /><span />Open only</label>
          <label className="select-control"><SlidersHorizontal size={15} /><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="trending">Trending</option><option value="volume">Volume</option><option value="newest">Newest</option><option value="ending">Ending soon</option></select></label>
        </div>
      </div>
      {showCategories ? <CategoryTabs categories={categories} active={category} onChange={setCategory} /> : null}
      <div className="market-grid">
        {visible.map((market) => <MarketCard market={market} key={market.id} />)}
      </div>
      {visible.length === 0 ? <div className="empty-state"><strong>No markets match this filter.</strong><span>Try another category or include resolved markets.</span></div> : null}
    </section>
  );
}
