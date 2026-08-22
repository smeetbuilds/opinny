"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import type { AccountBalance, CommandResult, Market, WalletTransactionRequest } from "@/core/contracts/domain";
import { dataAdapter } from "@/lib/data";
import { captureException } from "@/lib/observability";
import { walletAdapter } from "@/lib/wallet";
import { WalletDialog } from "./wallet-dialog";

type Toast = { id: string; title: string; description?: string };
export type PlatformNotification = {
  id: string;
  kind: "trade" | "market" | "funding" | "system";
  title: string;
  description: string;
  time: string;
  href?: string;
  read: boolean;
};

export type AccountPreferences = {
  orderType: "market" | "limit";
  slippageWarning: "0.5" | "1.0" | "2.0";
  orderEvents: boolean;
  resolutionEvents: boolean;
  fundingEvents: boolean;
};

export const defaultAccountPreferences: AccountPreferences = {
  orderType: "market",
  slippageWarning: "1.0",
  orderEvents: true,
  resolutionEvents: true,
  fundingEvents: true
};

type NotificationPreference = "orderEvents" | "resolutionEvents" | "fundingEvents";

type AppContextValue = {
  connected: boolean;
  walletAddress: string;
  walletProvider: string;
  walletReference: boolean;
  walletOpen: boolean;
  setWalletOpen: (open: boolean) => void;
  connectWallet: (provider?: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  executeWalletRequest: (request: WalletTransactionRequest) => Promise<CommandResult>;
  balances: AccountBalance[];
  balanceError: string;
  refreshBalances: () => Promise<void>;
  preferences: AccountPreferences;
  preferencesHydrated: boolean;
  savePreferences: (preferences: AccountPreferences) => void;
  resetPreferences: () => void;
  tradingEnabled: boolean;
  setTradingEnabled: (enabled: boolean) => void;
  marketCatalog: Market[];
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
  notifications: PlatformNotification[];
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  notify: (title: string, description?: string, kind?: PlatformNotification["kind"], preference?: NotificationPreference) => void;
};

const initialNotifications: PlatformNotification[] = [
  { id: "notification-1", kind: "trade", title: "Order partially filled", description: "240 of 800 shares were matched at 34¢.", time: "8 min", href: "/orders", read: false },
  { id: "notification-2", kind: "market", title: "Probability moved 6.4 points", description: "A market in your watchlist crossed your movement threshold.", time: "31 min", href: "/watchlist", read: false },
  { id: "notification-3", kind: "funding", title: "Crypto deposit confirmed", description: "1,200 USDC is available to trade.", time: "Yesterday", href: "/activity", read: true }
];

const watchlistKey = "opinny-watchlist-v1";
const walletSessionKey = "opinny-wallet-session-v1";
const notificationKey = "opinny-notifications-v1";
const preferencesKey = "opinny-account-preferences-v1";
const interfacePolicyKey = "opinny-interface-policy-v1";

const AppContext = createContext<AppContextValue | null>(null);

function isNotification(value: unknown): value is PlatformNotification {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<PlatformNotification>;
  return typeof item.id === "string"
    && ["trade", "market", "funding", "system"].includes(item.kind ?? "")
    && typeof item.title === "string"
    && typeof item.description === "string"
    && typeof item.time === "string"
    && typeof item.read === "boolean"
    && (item.href === undefined || typeof item.href === "string");
}

function isPreferences(value: unknown): value is AccountPreferences {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<AccountPreferences>;
  return (item.orderType === "market" || item.orderType === "limit")
    && (item.slippageWarning === "0.5" || item.slippageWarning === "1.0" || item.slippageWarning === "2.0")
    && typeof item.orderEvents === "boolean"
    && typeof item.resolutionEvents === "boolean"
    && typeof item.fundingEvents === "boolean";
}

export function AppProvider({ children, initialMarkets }: { children: React.ReactNode; initialMarkets: Market[] }) {
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletProvider, setWalletProvider] = useState("Browser wallet");
  const [walletReference, setWalletReference] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [balances, setBalances] = useState<AccountBalance[]>([]);
  const [balanceError, setBalanceError] = useState("");
  const [preferences, setPreferences] = useState<AccountPreferences>(defaultAccountPreferences);
  const [preferencesHydrated, setPreferencesHydrated] = useState(false);
  const [tradingEnabled, setTradingEnabledState] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(["mkt-001"]));
  const [notifications, setNotifications] = useState<PlatformNotification[]>(initialNotifications);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const toastTimers = useRef<Set<number>>(new Set());

  const refreshBalances = useCallback(async () => {
    try {
      setBalanceError("");
      setBalances(await dataAdapter.getBalances());
    } catch (error) {
      captureException(error, { operation: "getBalances" });
      setBalances([]);
      setBalanceError("Account balance is temporarily unavailable.");
    }
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;

      const storedFavorites = localStorage.getItem(watchlistKey);
      if (storedFavorites) {
        try {
          const parsed: unknown = JSON.parse(storedFavorites);
          if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) setFavorites(new Set(parsed));
          else localStorage.removeItem(watchlistKey);
        } catch {
          localStorage.removeItem(watchlistKey);
        }
      }

      const storedNotifications = localStorage.getItem(notificationKey);
      if (storedNotifications) {
        try {
          const parsed: unknown = JSON.parse(storedNotifications);
          if (Array.isArray(parsed) && parsed.every(isNotification)) setNotifications(parsed);
          else localStorage.removeItem(notificationKey);
        } catch {
          localStorage.removeItem(notificationKey);
        }
      }

      const storedPreferences = localStorage.getItem(preferencesKey);
      if (storedPreferences) {
        try {
          const parsed: unknown = JSON.parse(storedPreferences);
          if (isPreferences(parsed)) setPreferences(parsed);
          else localStorage.removeItem(preferencesKey);
        } catch {
          localStorage.removeItem(preferencesKey);
        }
      }
      setPreferencesHydrated(true);

      const storedPolicy = localStorage.getItem(interfacePolicyKey);
      if (storedPolicy) {
        try {
          const parsed: unknown = JSON.parse(storedPolicy);
          if (parsed && typeof parsed === "object" && typeof (parsed as { tradingEnabled?: unknown }).tradingEnabled === "boolean") {
            setTradingEnabledState((parsed as { tradingEnabled: boolean }).tradingEnabled);
          } else localStorage.removeItem(interfacePolicyKey);
        } catch {
          localStorage.removeItem(interfacePolicyKey);
        }
      }

      const storedWallet = sessionStorage.getItem(walletSessionKey);
      if (storedWallet) {
        try {
          const session = JSON.parse(storedWallet) as { connected?: unknown; provider?: unknown; address?: unknown; reference?: unknown };
          const validAddress = typeof session.address === "string" && /^0x[a-fA-F0-9]{40}$/.test(session.address);
          if (session.connected === true && validAddress && typeof session.provider === "string") {
            setConnected(true);
            setWalletAddress(session.address as string);
            setWalletProvider(session.provider);
            setWalletReference(session.reference === true);
            void dataAdapter.getBalances()
              .then((nextBalances) => { if (active) setBalances(nextBalances); })
              .catch((error) => {
                if (!active) return;
                captureException(error, { operation: "restoreBalances" });
                setBalanceError("Account balance is temporarily unavailable.");
              });
          } else sessionStorage.removeItem(walletSessionKey);
        } catch {
          sessionStorage.removeItem(walletSessionKey);
        }
      }

      setHydrated(true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(watchlistKey, JSON.stringify([...favorites]));
    } catch (error) {
      captureException(error, { operation: "persistWatchlist" });
    }
  }, [favorites, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(notificationKey, JSON.stringify(notifications.slice(0, 40)));
    } catch (error) {
      captureException(error, { operation: "persistNotifications" });
    }
  }, [notifications, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (connected) sessionStorage.setItem(walletSessionKey, JSON.stringify({ connected: true, provider: walletProvider, address: walletAddress, reference: walletReference }));
      else sessionStorage.removeItem(walletSessionKey);
    } catch (error) {
      captureException(error, { operation: "persistWalletSession" });
    }
  }, [connected, hydrated, walletAddress, walletProvider, walletReference]);

  useEffect(() => () => {
    for (const timer of toastTimers.current) window.clearTimeout(timer);
    toastTimers.current.clear();
  }, []);

  const notify = useCallback((title: string, description?: string, kind: PlatformNotification["kind"] = "system", preference?: NotificationPreference) => {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `toast-${Date.now()}-${Math.random()}`;
    setToasts((current) => [...current, { id, title, description }]);
    if (!preference || preferences[preference]) {
      setNotifications((current) => [{ id: `notification-${id}`, kind, title, description: description ?? "", time: "Now", read: false }, ...current].slice(0, 40));
    }
    const timer = window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
      toastTimers.current.delete(timer);
    }, 3200);
    toastTimers.current.add(timer);
  }, [preferences]);

  const connectWallet = useCallback(async (provider = "Browser wallet") => {
    try {
      const session = await walletAdapter.connect(provider);
      setWalletAddress(session.address);
      setWalletProvider(session.provider);
      setWalletReference(session.reference);
      setConnected(true);
      setWalletOpen(false);
      void refreshBalances();
      notify(session.reference ? "Reference wallet connected" : "Wallet connected", `${session.provider} is active for crypto trading and funding.`, "system");
    } catch (error) {
      captureException(error, { operation: "connectWallet", provider });
      notify("Wallet connection failed", "The wallet integration could not establish a session.", "system");
    }
  }, [notify, refreshBalances]);

  const disconnectWallet = useCallback(async () => {
    try {
      await walletAdapter.disconnect();
    } catch (error) {
      captureException(error, { operation: "disconnectWallet" });
    }
    setConnected(false);
    setWalletAddress("");
    setWalletReference(false);
    setBalances([]);
    setBalanceError("");
    notify("Wallet disconnected", "Reconnect a supported wallet to trade or move crypto.", "system");
  }, [notify]);

  const executeWalletRequest = useCallback(async (request: WalletTransactionRequest) => {
    try {
      return await walletAdapter.execute(request);
    } catch (error) {
      captureException(error, { operation: "executeWalletRequest", chainId: request.chainId });
      return { id: "wallet-request", status: "rejected" as const, message: "The wallet request could not be executed." };
    }
  }, []);

  const savePreferences = useCallback((next: AccountPreferences) => {
    setPreferences(next);
    try {
      localStorage.setItem(preferencesKey, JSON.stringify(next));
    } catch (error) {
      captureException(error, { operation: "persistPreferences" });
    }
  }, []);

  const resetPreferences = useCallback(() => {
    setPreferences(defaultAccountPreferences);
    try {
      localStorage.removeItem(preferencesKey);
    } catch (error) {
      captureException(error, { operation: "resetPreferences" });
    }
  }, []);

  const setTradingEnabled = useCallback((enabled: boolean) => {
    setTradingEnabledState(enabled);
    try {
      localStorage.setItem(interfacePolicyKey, JSON.stringify({ tradingEnabled: enabled }));
    } catch (error) {
      captureException(error, { operation: "persistInterfacePolicy" });
    }
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const markNotificationRead = useCallback((id: string) => setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item)), []);
  const markAllNotificationsRead = useCallback(() => setNotifications((current) => current.map((item) => ({ ...item, read: true }))), []);
  const clearNotifications = useCallback(() => setNotifications([]), []);
  const unreadCount = notifications.filter((item) => !item.read).length;

  const value = useMemo(
    () => ({
      connected,
      walletAddress,
      walletProvider,
      walletReference,
      walletOpen,
      setWalletOpen,
      connectWallet,
      disconnectWallet,
      executeWalletRequest,
      balances,
      balanceError,
      refreshBalances,
      preferences,
      preferencesHydrated,
      savePreferences,
      resetPreferences,
      tradingEnabled,
      setTradingEnabled,
      marketCatalog: initialMarkets,
      favorites,
      toggleFavorite,
      notifications,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
      notify
    }),
    [connected, walletAddress, walletProvider, walletReference, walletOpen, connectWallet, disconnectWallet, executeWalletRequest, balances, balanceError, refreshBalances, preferences, preferencesHydrated, savePreferences, resetPreferences, tradingEnabled, setTradingEnabled, initialMarkets, favorites, notifications, unreadCount, toggleFavorite, markNotificationRead, markAllNotificationsRead, clearNotifications, notify]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      <WalletDialog open={walletOpen} onClose={() => setWalletOpen(false)} onConnect={connectWallet} referenceMode={walletReference || false} />
      <div className="toast-viewport" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => <div className="toast" key={toast.id}><CheckCircle2 size={18} /><div><strong>{toast.title}</strong>{toast.description ? <span>{toast.description}</span> : null}</div><button aria-label="Dismiss notification" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}><X size={15} /></button></div>)}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
