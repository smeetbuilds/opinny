"use client";

import { useEffect } from "react";
import { ChevronRight, ShieldCheck, WalletCards, X, Zap } from "lucide-react";

const wallets = [
  { name: "Browser wallet", detail: "MetaMask, Rabby and compatible wallets", mark: "BW" },
  { name: "WalletConnect", detail: "Scan with any supported mobile wallet", mark: "WC" },
  { name: "Coinbase Wallet", detail: "Connect through Coinbase Wallet", mark: "CB" },
  { name: "Safe", detail: "Use a Safe multisig account", mark: "SF" }
];

export function WalletDialog({ open, onClose, onConnect }: { open: boolean; onClose: () => void; onConnect: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="overlay" role="presentation" onMouseDown={onClose}>
      <section className="wallet-sheet" role="dialog" aria-modal="true" aria-labelledby="wallet-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        <header className="dialog-head">
          <div>
            <span className="eyebrow">Crypto only</span>
            <h2 id="wallet-title">Connect your wallet</h2>
            <p>Trade, fund and withdraw using your self-custody wallet.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close wallet dialog"><X size={18} /></button>
        </header>
        <div className="wallet-list">
          {wallets.map((wallet) => (
            <button className="wallet-option" key={wallet.name} onClick={onConnect}>
              <span className="wallet-mark">{wallet.mark}</span>
              <span><strong>{wallet.name}</strong><small>{wallet.detail}</small></span>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
        <div className="wallet-assurance">
          <div><ShieldCheck size={17} /><span>Non-custodial connection</span></div>
          <div><WalletCards size={17} /><span>No card or bank funding</span></div>
          <div><Zap size={17} /><span>Network-aware transaction states</span></div>
        </div>
        <p className="dialog-footnote">By connecting, you acknowledge that transactions may require wallet signatures and network fees.</p>
      </section>
    </div>
  );
}
