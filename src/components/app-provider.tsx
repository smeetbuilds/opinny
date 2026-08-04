"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { WalletDialog } from "./wallet-dialog";

type Toast = { id: number; title: string; description?: string };

type AppContextValue = {
  connected: boolean;
  walletAddress: string;
  walletOpen: boolean;
  setWalletOpen: (open: boolean) => void;
  connectWallet: () => void;
  disconnectWallet: () => void;
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
  notify: (title: string, description?: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(["mkt-001"]));
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((title: string, description?: string) => {
    const id = Date.now();
    setToasts((current) => [...current, { id, title, description }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 3200);
  }, []);

  const connectWallet = useCallback(() => {
    setConnected(true);
    setWalletOpen(false);
    notify("Wallet connected", "Demo account 0x19B6…7A42 is now active.");
  }, [notify]);

  const disconnectWallet = useCallback(() => {
    setConnected(false);
    notify("Wallet disconnected");
  }, [notify]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      connected,
      walletAddress: "0x19B60F0A4218D3E54A6FBD7A42",
      walletOpen,
      setWalletOpen,
      connectWallet,
      disconnectWallet,
      favorites,
      toggleFavorite,
      notify
    }),
    [connected, walletOpen, favorites, connectWallet, disconnectWallet, toggleFavorite, notify]
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
