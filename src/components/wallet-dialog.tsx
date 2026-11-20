"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, CircleDollarSign, LoaderCircle, Network, ShieldCheck, WalletCards, X, Zap } from "lucide-react";
import { appConfig } from "@/lib/config";

const wallets = [
  { name: "Browser wallet", detail: "MetaMask, Rabby and compatible wallets", mark: "BW" },
  { name: "WalletConnect", detail: "Scan with any supported mobile wallet", mark: "WC" },
  { name: "Coinbase Wallet", detail: "Connect through Coinbase Wallet", mark: "CB" },
  { name: "Safe", detail: "Use a Safe multisig account", mark: "SF" }
];

export function WalletDialog({ open, onClose, onConnect }: { open: boolean; onClose: () => void; onConnect: (provider?: string) => Promise<void>; referenceMode?: boolean }) {
  const [connecting, setConnecting] = useState("");
  const sheetRef = useRef<HTMLElement>(null);
  const referenceMode = appConfig.adapter === "mock";

  useEffect(() => {
    if (!open) return;
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const frame = window.requestAnimationFrame(() => {
      sheetRef.current?.querySelector<HTMLElement>('[aria-label="Close wallet dialog"]')?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !connecting) { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab") return;
      const focusables = [...(sheetRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])];
      if (!focusables.length) { event.preventDefault(); return; }
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      returnFocus?.focus();
    };
  }, [connecting, open, onClose]);

  if (!open) return null;

  async function connect(provider: string) {
    if (connecting) return;
    setConnecting(provider);
    try {
      await onConnect(provider);
    } finally {
      setConnecting("");
    }
  }

  return (
    <div className="overlay" role="presentation" onMouseDown={() => !connecting && onClose()}>
      <section ref={sheetRef} className="wallet-sheet" role="dialog" aria-modal="true" aria-labelledby="wallet-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        <header className="dialog-head">
          <div>
            <span className="eyebrow">{referenceMode ? "Paper market · local session" : "Crypto only"}</span>
            <h2 id="wallet-title">{referenceMode ? "Start paper trading" : "Connect your wallet"}</h2>
            <p>{referenceMode ? "Practice buying, selling, funding and order management with a persistent simulated account." : "Use a self-custody wallet to trade, deposit and withdraw supported crypto assets."}</p>
          </div>
          <button className="icon-button" disabled={Boolean(connecting)} onClick={onClose} aria-label="Close wallet dialog"><X size={18} /></button>
        </header>
        <div className="wallet-network-row">
          <span><Network size={15} /><small>Network</small><strong>{appConfig.chainName}</strong></span>
          <span><CircleDollarSign size={15} /><small>Primary collateral</small><strong>{appConfig.collateral}</strong></span>
        </div>
        <div className="wallet-list">
          {(referenceMode ? [{ name: "Paper wallet", detail: "Start with simulated balances; no real wallet required", mark: "OP" }] : wallets).map((wallet) => (
            <button className="wallet-option" disabled={Boolean(connecting)} key={wallet.name} onClick={() => void connect(wallet.name)}>
              <span className="wallet-mark">{wallet.mark}</span>
              <span><strong>{wallet.name}</strong><small>{wallet.detail}</small></span>
              {connecting === wallet.name ? <LoaderCircle className="spin" size={18} /> : <ChevronRight size={18} />}
            </button>
          ))}
        </div>
        <div className="wallet-assurance">
          <div><ShieldCheck size={17} /><span>{referenceMode ? "No real wallet needed" : "Non-custodial connection"}</span></div>
          <div><WalletCards size={17} /><span>No card or bank funding</span></div>
          <div><Zap size={17} /><span>{referenceMode ? "No transaction is broadcast" : "Wallet-approved transactions"}</span></div>
        </div>
        <p className="dialog-footnote">{referenceMode ? "Reference mode simulates wallet approval for interface testing. It never signs or sends a blockchain transaction." : "Wallet signatures and network fees may be required. Never share a recovery phrase or private key."}</p>
      </section>
    </div>
  );
}
