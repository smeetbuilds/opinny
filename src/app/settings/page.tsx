"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle2, Copy, Globe2, KeyRound, LogOut, RotateCcw, Save, ShieldCheck, SlidersHorizontal, WalletCards } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { AccountShell } from "@/components/account-shell";
import { useApp } from "@/components/app-provider";
import { shortAddress } from "@/lib/format";
import { appConfig } from "@/lib/config";

type Preferences = {
  orderType: "market" | "limit";
  referenceCurrency: "USD" | "USDC";
  slippageWarning: "0.5" | "1.0" | "2.0";
  orderEvents: boolean;
  resolutionEvents: boolean;
  movementEvents: boolean;
  fundingEvents: boolean;
};

const defaults: Preferences = {
  orderType: "market",
  referenceCurrency: "USD",
  slippageWarning: "1.0",
  orderEvents: true,
  resolutionEvents: true,
  movementEvents: false,
  fundingEvents: true
};

const storageKey = "opinny-account-preferences-v1";

export default function SettingsPage() {
  const { walletAddress, walletProvider, connected, setWalletOpen, disconnectWallet, notify } = useApp();
  const [preferences, setPreferences] = useState(defaults);
  const [saved, setSaved] = useState(defaults);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = { ...defaults, ...JSON.parse(stored) } as Preferences;
        setPreferences(parsed);
        setSaved(parsed);
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
    setHydrated(true);
  }, []);

  const dirty = useMemo(() => JSON.stringify(preferences) !== JSON.stringify(saved), [preferences, saved]);

  function update<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  function save() {
    localStorage.setItem(storageKey, JSON.stringify(preferences));
    setSaved(preferences);
    notify("Preferences saved", "Trading and notification defaults were updated.", "system");
  }

  function reset() {
    localStorage.removeItem(storageKey);
    setPreferences(defaults);
    setSaved(defaults);
    notify("Preferences reset", "Default account preferences were restored.", "system");
  }

  async function copyAddress() {
    await navigator.clipboard.writeText(walletAddress);
    notify("Address copied", shortAddress(walletAddress), "system");
  }

  return (
    <SiteShell>
      <div className="page-container inner-page">
        <AccountShell title="Settings" eyebrow="Account" description="Manage wallet, notifications and trading preferences." actions={<div className="settings-save-actions"><span className={dirty ? "dirty" : "saved"}>{dirty ? "Unsaved changes" : "Preferences saved"}</span><button className="secondary-button compact" type="button" onClick={reset}><RotateCcw size={14} />Reset</button><button className="primary-button compact" type="button" onClick={save} disabled={!dirty || !hydrated}><Save size={14} />Save</button></div>}>
          <div className="account-policy-strip">
            <span><ShieldCheck size={17} /><small>Funding policy</small><strong>Crypto only</strong></span>
            <span><Globe2 size={17} /><small>Network</small><strong>{appConfig.chainName}</strong></span>
            <span><WalletCards size={17} /><small>Custody</small><strong>Connected wallet</strong></span>
            <span><CheckCircle2 size={17} /><small>Collateral</small><strong>{appConfig.collateral}</strong></span>
          </div>

          <div className="settings-grid enhanced-account-settings">
            <section className="settings-card">
              <div className="settings-card-head"><span className="settings-icon"><WalletCards size={18} /></span><div><h2>Connected wallet</h2><p>Primary account used for trading, deposits and withdrawals.</p></div></div>
              <div className="connected-wallet-row">
                <span className="wallet-mark">{walletProvider.split(" ").map((word) => word[0]).join("").slice(0, 2)}</span>
                <div><strong>{connected ? shortAddress(walletAddress) : "No wallet connected"}</strong><small>{connected ? `${walletProvider} · ${appConfig.chainName}` : "Connect a supported crypto wallet"}</small></div>
                {connected ? <><button className="icon-button" aria-label="Copy wallet address" onClick={copyAddress}><Copy size={16} /></button><button className="text-button danger" onClick={disconnectWallet}><LogOut size={15} />Disconnect</button></> : <button className="primary-button compact" onClick={() => setWalletOpen(true)}>Connect wallet</button>}
              </div>
              <div className="settings-card-note"><ShieldCheck size={15} /><span>Opinny never asks for a recovery phrase or private key.</span></div>
            </section>

            <section className="settings-card">
              <div className="settings-card-head"><span className="settings-icon"><Bell size={18} /></span><div><h2>Notifications</h2><p>Choose which market and account events appear in the notification centre.</p></div></div>
              <label className="setting-toggle"><span>Order updates<small>Filled, partially filled and cancelled orders.</small></span><input type="checkbox" checked={preferences.orderEvents} onChange={(event) => update("orderEvents", event.target.checked)} /><i /></label>
              <label className="setting-toggle"><span>Resolution updates<small>Proposal, dispute and final resolution events.</small></span><input type="checkbox" checked={preferences.resolutionEvents} onChange={(event) => update("resolutionEvents", event.target.checked)} /><i /></label>
              <label className="setting-toggle"><span>Large market movement<small>Probability movement above your configured threshold.</small></span><input type="checkbox" checked={preferences.movementEvents} onChange={(event) => update("movementEvents", event.target.checked)} /><i /></label>
              <label className="setting-toggle"><span>Crypto funding<small>Deposit and withdrawal confirmations.</small></span><input type="checkbox" checked={preferences.fundingEvents} onChange={(event) => update("fundingEvents", event.target.checked)} /><i /></label>
            </section>

            <section className="settings-card span-two">
              <div className="settings-card-head"><span className="settings-icon"><SlidersHorizontal size={18} /></span><div><h2>Trading preferences</h2><p>Defaults used when opening a market ticket. These settings never authorize a transaction.</p></div></div>
              <div className="preference-grid">
                <label><span><KeyRound size={16} />Default order type</span><select value={preferences.orderType} onChange={(event) => update("orderType", event.target.value as Preferences["orderType"])}><option value="market">Market</option><option value="limit">Limit</option></select><small>Market orders prioritize execution; limit orders prioritize price.</small></label>
                <label><span><Globe2 size={16} />Reference display</span><select value={preferences.referenceCurrency} onChange={(event) => update("referenceCurrency", event.target.value as Preferences["referenceCurrency"])}><option value="USD">USD reference</option><option value="USDC">USDC</option></select><small>This changes display only. Funding remains crypto-only.</small></label>
                <label><span><ShieldCheck size={16} />Slippage warning</span><select value={preferences.slippageWarning} onChange={(event) => update("slippageWarning", event.target.value as Preferences["slippageWarning"])}><option value="0.5">0.5%</option><option value="1.0">1.0%</option><option value="2.0">2.0%</option></select><small>Show a warning before preparing orders above this estimate.</small></label>
              </div>
            </section>
          </div>
        </AccountShell>
      </div>
    </SiteShell>
  );
}
