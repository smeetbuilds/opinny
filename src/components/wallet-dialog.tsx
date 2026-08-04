"use client";

import { useEffect } from "react";
import { ChevronRight, CircleDollarSign, Network, ShieldCheck, WalletCards, X, Zap } from "lucide-react";
import { appConfig } from "@/lib/config";

const wallets = [
  { name: "Browser wallet", detail: "MetaMask, Rabby and compatible wallets", mark: "BW" },
  { name: "WalletConnect", detail: "Scan with any supported mobile wallet", mark: "WC" },
  { name: "Coinbase Wallet", detail: "Connect through Coinbase Wallet", mark: "CB" },
  { name: "Safe", detail: "Use a Safe multisig account", mark: "SF" }
];

export function WalletDialog({ open, onClose, onConnect }: { open: boolean; onClose: () => void; onConnect: (provider?: string) => void }) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
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
            <p>Use a self-custody wallet to trade, deposit and withdraw supported crypto assets.</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close wallet dialog"><X size={18} /></button>
        </header>
        <div className="wallet-network-row">
          <span><Network size={15} /><small>Network</small><strong>{appConfig.chainName}</strong></span>
          <span><CircleDollarSign size={15} /><small>Primary collateral</small><strong>{appConfig.collateral}</strong></span>
        </div>
        <div className="wallet-list">
          {wallets.map((wallet) => (
            <button className="wallet-option" key={wallet.name} onClick={() => onConnect(wallet.name)}>
              <span className="wallet-mark">{wallet.mark}</span>
              <span><strong>{wallet.name}</strong><small>{wallet.detail}</small></span>
              <ChevronRight size={18} />
            </button>
          ))}
        </div>
        <div className="wallet-assurance">
          <div><ShieldCheck size={17} /><span>Non-custodial connection</span></div>
          <div><WalletCards size={17} /><span>No card or bank funding</span></div>
          <div><Zap size={17} /><span>Wallet-approved transactions</span></div>
        </div>
        <p className="dialog-footnote">Wallet signatures and network fees may be required. Never share a recovery phrase or private key.</p>
      </section>
    </div>
  );
}
