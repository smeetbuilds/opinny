"use client";

import { useEffect, useState } from "react";
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
  const referenceMode = appConfig.adapter === "mock";

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !connecting) onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
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
      <section className="wallet-sheet" role="dialog" aria-modal="true" aria-labelledby="wallet-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        <header className="dialog-head">
          <div>
            <span className="eyebrow">Crypto only</span>
            <h2 id="wallet-title">Connect your wallet</h2>
            <p>{referenceMode ? "Use a reference wallet session to preview the trading and funding flows." : "Use a self-custody wallet to trade, deposit and withdraw supported crypto assets."}</p>
          </div>
          <button className="icon-button" disabled={Boolean(connecting)} onClick={onClose} aria-label="Close wallet dialog"><X size={18} /></button>
        </header>
        <div className="wallet-network-row">
          <span><Network size={15} /><small>Network</small><strong>{appConfig.chainName}</strong></span>
          <span><CircleDollarSign size={15} /><small>Primary collateral</small><strong>{appConfig.collateral}</strong></span>
        </div>
        <div className="wallet-list">
          {wallets.map((wallet) => (
            <button className="wallet-option" disabled={Boolean(connecting)} key={wallet.name} onClick={() => void connect(wallet.name)}>
              <span className="wallet-mark">{wallet.mark}</span>
              <span><strong>{wallet.name}</strong><small>{wallet.detail}</small></span>
              {connecting === wallet.name ? <LoaderCircle className="spin" size={18} /> : <ChevronRight size={18} />}
            </button>
          ))}
        </div>
        <div className="wallet-assurance">
          <div><ShieldCheck size={17} /><span>{referenceMode ? "Reference session only" : "Non-custodial connection"}</span></div>
          <div><WalletCards size={17} /><span>No card or bank funding</span></div>
          <div><Zap size={17} /><span>{referenceMode ? "No transaction is broadcast" : "Wallet-approved transactions"}</span></div>
        </div>
        <p className="dialog-footnote">{referenceMode ? "Reference mode simulates wallet approval for interface testing. It never signs or sends a blockchain transaction." : "Wallet signatures and network fees may be required. Never share a recovery phrase or private key."}</p>
      </section>
    </div>
  );
}
