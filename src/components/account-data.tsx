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

function useAdapterData<T>(loader: () => Promise<T>, operation: string) {
  const [state, setState] = useState<LoadState<T>>({ data: null, error: "" });

  useEffect(() => {
    let active = true;
    void loader()
      .then((data) => {
        if (active) setState({ data, error: "" });
      })
      .catch((error) => {
        if (!active) return;
        captureException(error, { operation });
        setState({ data: null, error: "Account data is temporarily unavailable." });
      });
    return () => { active = false; };
  }, [loader, operation]);

  const reload = useCallback(async () => {
    setState({ data: null, error: "" });
    try {
      setState({ data: await loader(), error: "" });
    } catch (error) {
      captureException(error, { operation });
      setState({ data: null, error: "Account data is temporarily unavailable." });
    }
  }, [loader, operation]);

  return { ...state, reload };
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

function ConnectedOrdersData() {
  const state = useAdapterData<UserOrder[]>(loadOrders, "getOrders");
  return state.data ? <OrdersTable orders={state.data} /> : <AccountDataState error={state.error} reload={state.reload} />;
}

function ConnectedPortfolioData() {
  const state = useAdapterData<Position[]>(loadPositions, "getPositions");
  return state.data ? <PortfolioConsole positions={state.data} /> : <AccountDataState error={state.error} reload={state.reload} />;
}

function ConnectedActivityData() {
  const state = useAdapterData<ActivityItem[]>(loadActivity, "getActivity");
  return state.data ? <ActivityFeed items={state.data} /> : <AccountDataState error={state.error} reload={state.reload} />;
}

export function OrdersData() {
  const { connected, setWalletOpen } = useApp();
  return connected ? <ConnectedOrdersData /> : <ConnectAccountState onConnect={() => setWalletOpen(true)} />;
}

export function PortfolioData() {
  const { connected, setWalletOpen } = useApp();
  return connected ? <ConnectedPortfolioData /> : <ConnectAccountState onConnect={() => setWalletOpen(true)} />;
}

export function ActivityData() {
  const { connected, setWalletOpen } = useApp();
  return connected ? <ConnectedActivityData /> : <ConnectAccountState onConnect={() => setWalletOpen(true)} />;
}
