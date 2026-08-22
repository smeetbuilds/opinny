"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Market, OrderBookLevel, RecentTrade } from "@/core/contracts/domain";
import { dataAdapter } from "@/lib/data";
import { captureException } from "@/lib/observability";
import { OrderBook } from "./order-book";
import { RecentTrades } from "./recent-trades";

type Book = { bids: OrderBookLevel[]; asks: OrderBookLevel[] };
type SyncState = "ready" | "syncing" | "stale";

export function MarketLiveData({
  market,
  initialBook,
  initialTrades
}: {
  market: Market;
  initialBook: Book;
  initialTrades: RecentTrade[];
}) {
  const [outcomeId, setOutcomeId] = useState(market.outcomes[0]?.id ?? "");
  const [book, setBook] = useState(initialBook);
  const [trades, setTrades] = useState(initialTrades);
  const [syncState, setSyncState] = useState<SyncState>("ready");
  const [sequence, setSequence] = useState(0);
  const generation = useRef(0);
  const selectedOutcome = useRef(outcomeId);
  const refreshTimer = useRef<number | null>(null);
  const pendingSequence = useRef(0);

  useEffect(() => {
    selectedOutcome.current = outcomeId;
  }, [outcomeId]);

  const refresh = useCallback(async (nextOutcomeId: string, nextSequence?: number) => {
    if (!nextOutcomeId) return;
    const currentGeneration = ++generation.current;
    setSyncState("syncing");
    try {
      const [nextBook, nextTrades] = await Promise.all([
        dataAdapter.getOrderBook(market.id, nextOutcomeId),
        dataAdapter.getRecentTrades(market.id)
      ]);
      if (currentGeneration !== generation.current || selectedOutcome.current !== nextOutcomeId) return;
      setBook(nextBook);
      setTrades(nextTrades);
      if (nextSequence !== undefined) setSequence((current) => Math.max(current, nextSequence));
      setSyncState("ready");
    } catch (cause) {
      if (currentGeneration !== generation.current || selectedOutcome.current !== nextOutcomeId) return;
      captureException(cause, { operation: "refreshMarketLiveData", marketId: market.id, outcomeId: nextOutcomeId });
      setSyncState("stale");
    }
  }, [market.id]);

  const scheduleRefresh = useCallback((nextOutcomeId: string, nextSequence: number) => {
    pendingSequence.current = Math.max(pendingSequence.current, nextSequence);
    if (refreshTimer.current !== null) return;
    refreshTimer.current = window.setTimeout(() => {
      refreshTimer.current = null;
      const sequenceToApply = pendingSequence.current;
      pendingSequence.current = 0;
      void refresh(nextOutcomeId, sequenceToApply);
    }, 100);
  }, [refresh]);

  useEffect(() => {
    if (!outcomeId) return;
    const unsubscribe = dataAdapter.subscribeToMarket(market.id, (event) => {
      if (event.marketId !== market.id) return;
      if (event.type === "order-book" && event.outcomeId !== outcomeId) return;
      if (event.type === "price" && event.outcomeId !== outcomeId) return;
      scheduleRefresh(outcomeId, event.sequence);
    });
    return () => {
      unsubscribe();
      if (refreshTimer.current !== null) {
        window.clearTimeout(refreshTimer.current);
        refreshTimer.current = null;
      }
      pendingSequence.current = 0;
    };
  }, [market.id, outcomeId, scheduleRefresh]);

  function selectOutcome(nextOutcomeId: string) {
    if (nextOutcomeId === outcomeId) return;
    if (refreshTimer.current !== null) {
      window.clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
    pendingSequence.current = 0;
    generation.current += 1;
    selectedOutcome.current = nextOutcomeId;
    setOutcomeId(nextOutcomeId);
    void refresh(nextOutcomeId);
  }

  return (
    <section className="market-live-section" id="market-depth" aria-labelledby="market-depth-title">
      <div className="market-live-toolbar">
        <div>
          <span className="eyebrow">Live liquidity</span>
          <h2 id="market-depth-title">Market depth & trades</h2>
        </div>
        <div className="market-live-controls">
          {market.outcomes.length > 1 ? (
            <div className="depth-outcome-tabs" aria-label="Market depth outcome">
              {market.outcomes.map((outcome) => (
                <button
                  type="button"
                  className={outcome.id === outcomeId ? "active" : ""}
                  aria-pressed={outcome.id === outcomeId}
                  onClick={() => selectOutcome(outcome.id)}
                  key={outcome.id}
                >
                  {outcome.label}
                </button>
              ))}
            </div>
          ) : null}
          <span className={`market-sync-state ${syncState}`} role="status" aria-live="polite">
            <RefreshCw className={syncState === "syncing" ? "spin" : ""} size={13} />
            {syncState === "syncing" ? "Syncing" : syncState === "stale" ? "Feed unavailable" : sequence ? "Live feed" : "Market data"}
          </span>
        </div>
      </div>

      <div className="market-data-grid">
        <OrderBook bids={book.bids} asks={book.asks} />
        <div id="recent-trades">
          <RecentTrades trades={trades} statusLabel={syncState === "stale" ? "Latest available matched activity" : "Live matched activity"} />
        </div>
      </div>
    </section>
  );
}
