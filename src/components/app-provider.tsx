"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { WalletDialog } from "./wallet-dialog";

type Toast = { id: number; title: string; description?: string };
export type PlatformNotification = {
  id: string;
  kind: "trade" | "market" | "funding" | "system";
  title: string;
  description: string;
  time: string;
  href?: string;
  read: boolean;
};

type AppContextValue = {
  connected: boolean;
  walletAddress: string;
  walletProvider: string;
  walletOpen: boolean;
  setWalletOpen: (open: boolean) => void;
  connectWallet: (provider?: string) => void;
  disconnectWallet: () => void;
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
  notifications: PlatformNotification[];
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  notify: (title: string, description?: string, kind?: PlatformNotification["kind"]) => void;
};

const initialNotifications: PlatformNotification[] = [
  {
    id: "notification-1",
    kind: "trade",
    title: "Order partially filled",
    description: "240 of 800 shares were matched at 34¢.",
    time: "8 min",
    href: "/orders",
    read: false
  },
  {
    id: "notification-2",
    kind: "market",
    title: "Probability moved 6.4 points",
    description: "A market in your watchlist crossed your movement threshold.",
    time: "31 min",
    href: "/watchlist",
    read: false
  },
  {
    id: "notification-3",
    kind: "funding",
    title: "Crypto deposit confirmed",
    description: "1,200 USDC is available to trade.",
    time: "Yesterday",
    href: "/activity",
    read: true
  }
];

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [walletProvider, setWalletProvider] = useState("Browser wallet");
  const [walletOpen, setWalletOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(["mkt-001"]));
  const [notifications, setNotifications] = useState<PlatformNotification[]>(initialNotifications);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [favoritesHydrated, setFavoritesHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("opinny-watchlist-v1");
    if (stored) {
      try {
        setFavorites(new Set(JSON.parse(stored) as string[]));
      } catch {
        localStorage.removeItem("opinny-watchlist-v1");
      }
    }
    setFavoritesHydrated(true);
  }, []);

  useEffect(() => {
    if (!favoritesHydrated) return;
    localStorage.setItem("opinny-watchlist-v1", JSON.stringify([...favorites]));
  }, [favorites, favoritesHydrated]);

  const notify = useCallback((title: string, description?: string, kind: PlatformNotification["kind"] = "system") => {
    const id = Date.now();
    setToasts((current) => [...current, { id, title, description }]);
    setNotifications((current) => [{ id: `notification-${id}`, kind, title, description: description ?? "", time: "Now", read: false }, ...current]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3200);
  }, []);

  const connectWallet = useCallback((provider = "Browser wallet") => {
    setWalletProvider(provider);
    setConnected(true);
    setWalletOpen(false);
    notify("Wallet connected", `${provider} is active for crypto trading and funding.`, "system");
  }, [notify]);

  const disconnectWallet = useCallback(() => {
    setConnected(false);
    notify("Wallet disconnected", "Reconnect a supported wallet to trade or move crypto.", "system");
  }, [notify]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  }, []);

  const clearNotifications = useCallback(() => setNotifications([]), []);
  const unreadCount = notifications.filter((item) => !item.read).length;

  const value = useMemo(
    () => ({
      connected,
      walletAddress: "0x19B60F0A4218D3E54A6FBD7A42C8B8F0D9E7A42A",
      walletProvider,
      walletOpen,
      setWalletOpen,
      connectWallet,
      disconnectWallet,
      favorites,
      toggleFavorite,
      notifications,
      unreadCount,
      markNotificationRead,
      markAllNotificationsRead,
      clearNotifications,
      notify
    }),
    [connected, walletProvider, walletOpen, favorites, notifications, unreadCount, connectWallet, disconnectWallet, toggleFavorite, markNotificationRead, markAllNotificationsRead, clearNotifications, notify]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      <WalletDialog open={walletOpen} onClose={() => setWalletOpen(false)} onConnect={connectWallet} />
      <div className="toast-viewport" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div className="toast" key={toast.id}>
            <CheckCircle2 size={18} />
            <div>
              <strong>{toast.title}</strong>
              {toast.description ? <span>{toast.description}</span> : null}
            </div>
            <button aria-label="Dismiss notification" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}>
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
