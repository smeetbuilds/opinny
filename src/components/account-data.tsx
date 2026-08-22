"use client";

import { AlertCircle, LoaderCircle, Wallet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { ActivityItem, Position, UserOrder } from "@/core/contracts/domain";
import { dataAdapter } from "@/lib/data";
import { captureException } from "@/lib/observability";
import { useApp } from "./app-provider";
import { ActivityFeed } from "./activity-feed";
import { OrdersTable } from "./orders-table";
import { PortfolioConsole } from "./portfolio-console";

type LoadState<T> = { data: T | null; error: string };

function useAdapterData<T>(loader: () => Promise<T>, operation: string, enabled: boolean) {
  const [state, setState] = useState<LoadState<T>>({ data: null, error: "" });
  const load = useCallback(async () => {
    if (!enabled) {
      setState({ data: null, error: "" });
      return;
    }
    setState({ data: null, error: "" });
    try {
      setState({ data: await loader(), error: "" });
    } catch (error) {
      captureException(error, { operation });
      setState({ data: null, error: "Account data is temporarily unavailable." });
    }
  }, [enabled, loader, operation]);

  useEffect(() => { void load(); }, [load]);
  return { ...state, reload: load };
}

function AccountDataState({ error, reload }: { error: string; reload: () => Promise<void> }) {
  if (!error) return <div className="table-empty large" role="status" aria-live="polite"><LoaderCircle className="spin" size={22} /><strong>Loading account data</strong><span>Reading the latest state from the connected integration.</span></div>;
  return <div className="table-empty large" role="alert"><AlertCircle size={22} /><strong>Account data unavailable</strong><span>{error}</span><button type="button" onClick={() => void reload()}>Try again</button></div>;
}

function ConnectAccountState({ onConnect }: { onConnect: () => void }) {
  return <div className="table-empty large"><Wallet size={22} /><strong>Connect your wallet</strong><span>Account-specific data is requested only after a wallet session is connected.</span><button type="button" onClick={onConnect}>Connect wallet</button></div>;
}

const loadOrders = () => dataAdapter.getOrders();
const loadPositions = () => dataAdapter.getPositions();
const loadActivity = () => dataAdapter.getActivity();

export function OrdersData() {
  const { connected, setWalletOpen } = useApp();
  const state = useAdapterData<UserOrder[]>(loadOrders, "getOrders", connected);
  if (!connected) return <ConnectAccountState onConnect={() => setWalletOpen(true)} />;
  return state.data ? <OrdersTable orders={state.data} /> : <AccountDataState error={state.error} reload={state.reload} />;
}

export function PortfolioData() {
  const { connected, setWalletOpen } = useApp();
  const state = useAdapterData<Position[]>(loadPositions, "getPositions", connected);
  if (!connected) return <ConnectAccountState onConnect={() => setWalletOpen(true)} />;
  return state.data ? <PortfolioConsole positions={state.data} /> : <AccountDataState error={state.error} reload={state.reload} />;
}

export function ActivityData() {
  const { connected, setWalletOpen } = useApp();
  const state = useAdapterData<ActivityItem[]>(loadActivity, "getActivity", connected);
  if (!connected) return <ConnectAccountState onConnect={() => setWalletOpen(true)} />;
  return state.data ? <ActivityFeed items={state.data} /> : <AccountDataState error={state.error} reload={state.reload} />;
}
