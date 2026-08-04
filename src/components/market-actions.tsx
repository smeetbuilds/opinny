"use client";

import { Bookmark, Check, Share2 } from "lucide-react";
import { useApp } from "./app-provider";

export function MarketActions({ marketId, title }: { marketId: string; title: string }) {
  const { favorites, toggleFavorite, notify } = useApp();
  const saved = favorites.has(marketId);

  const toggleSaved = () => {
    toggleFavorite(marketId);
    notify(saved ? "Market removed" : "Market saved", saved ? "This market was removed from your watchlist." : "This market was added to your watchlist.");
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      notify("Link copied", "The market link is ready to share.");
    } catch {
      notify("Share cancelled", "No changes were made.");
    }
  };

  return (
    <div className="market-actions">
      <button className={saved ? "icon-button active" : "icon-button"} type="button" aria-label={saved ? "Remove market from watchlist" : "Save market to watchlist"} aria-pressed={saved} onClick={toggleSaved}>
        {saved ? <Check size={18} /> : <Bookmark size={18} />}
      </button>
      <button className="icon-button" type="button" aria-label="Share market" onClick={share}>
        <Share2 size={18} />
      </button>
    </div>
  );
}
