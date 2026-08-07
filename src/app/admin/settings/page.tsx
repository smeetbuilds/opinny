"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing, CheckCircle2, Database, Globe2, Network, RotateCcw, Save, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useApp } from "@/components/app-provider";
import { appConfig } from "@/lib/config";

type SettingsState = {
  adapter: string;
  httpEndpoint: string;
  websocketEndpoint: string;
  chainId: string;
  network: string;
  collateralAsset: string;
  geographicGate: string;
  identityStatus: string;
  riskReview: boolean;
  orderEvents: boolean;
  resolutionEvents: boolean;
  systemAlerts: boolean;
  minimumOrderSize: string;
  tickSize: string;
  disputeWindow: string;
  timezone: string;
  publicDiscovery: boolean;
  tradingEnabled: boolean;
};

const defaults: SettingsState = {
  adapter: appConfig.adapter,
  httpEndpoint: appConfig.apiUrl,
  websocketEndpoint: appConfig.webSocketUrl,
  chainId: String(appConfig.chainId),
  network: appConfig.chainName,
  collateralAsset: appConfig.collateral,
  geographicGate: "Backend controlled",
  identityStatus: "Adapter supplied",
  riskReview: true,
  orderEvents: true,
  resolutionEvents: true,
  systemAlerts: true,
  minimumOrderSize: "5",
  tickSize: "0.01",
  disputeWindow: "24",
  timezone: "UTC",
  publicDiscovery: true,
  tradingEnabled: true
};

const storageKey = "opinny-admin-settings-v1";

function adapterLabel(value: string) {
  if (value === "mock") return "Reference";
  if (value === "rest") return "REST";
  if (value === "graphql") return "GraphQL";
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "Custom";
}

export default function AdminSettingsPage() {
  const { notify } = useApp();
  const [settings, setSettings] = useState(defaults);
  const [saved, setSaved] = useState(defaults);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = { ...defaults, ...JSON.parse(stored) } as SettingsState;
        setSettings(parsed);
        setSaved(parsed);
      } catch {
        localStorage.removeItem(storageKey);
      }
    }
    setHydrated(true);
  }, []);

  const dirty = useMemo(() => JSON.stringify(settings) !== JSON.stringify(saved), [settings, saved]);
  const valid = Number(settings.minimumOrderSize) > 0 && Number(settings.tickSize) > 0 && Number(settings.disputeWindow) > 0 && Number(settings.chainId) > 0;

  function update<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  function save() {
    if (!valid) {
      notify("Review invalid settings", "Order size, tick size, dispute window and chain ID must be positive values.", "system");
      return;
    }
    localStorage.setItem(storageKey, JSON.stringify(settings));
    setSaved(settings);
    notify("Settings saved", "Operational preferences were saved on this device.", "system");
  }

  function reset() {
    setSettings(defaults);
    setSaved(defaults);
    localStorage.removeItem(storageKey);
    notify("Settings reset", "Default interface configuration restored.", "system");
  }

  const actions = <div className="admin-settings-actions"><span className={`save-state ${dirty ? "dirty" : "saved"}`}>{dirty ? "Unsaved changes" : "All changes saved"}</span><button className="secondary-button compact" type="button" onClick={reset}><RotateCcw size={14} />Reset</button><button className="primary-button compact" type="button" disabled={!dirty || !valid || !hydrated} onClick={save}><Save size={14} />Save changes</button></div>;

  return (
    <AdminShell title="Settings" description="Integration and operational presentation settings." actions={actions}>
      <div className="settings-health-strip">
        <div><CheckCircle2 size={18} /><span><strong>Configuration profile</strong><small>{adapterLabel(settings.adapter)} integration profile</small></span></div>
        <span>Network <strong>{settings.network}</strong></span>
        <span>Collateral <strong>{settings.collateralAsset}</strong></span>
        <span>Trading <strong>{settings.tradingEnabled ? "Enabled" : "Paused"}</strong></span>
      </div>

      <div className="admin-settings-grid enhanced-settings-grid">
        <section className="admin-settings-card">
          <header><span><Database size={18} /></span><div><h2>Data integration</h2><p>Transport and market-data connection.</p></div></header>
          <label><span>Integration profile</span><select value={settings.adapter} onChange={(event) => update("adapter", event.target.value)}><option value="mock">Reference adapter</option><option value="rest">REST adapter</option><option value="graphql">GraphQL adapter</option><option value="custom">Custom adapter</option></select></label>
          <label><span>HTTP endpoint</span><input value={settings.httpEndpoint} onChange={(event) => update("httpEndpoint", event.target.value)} placeholder="https://api.example.com" /></label>
          <label><span>WebSocket endpoint</span><input value={settings.websocketEndpoint} onChange={(event) => update("websocketEndpoint", event.target.value)} placeholder="wss://stream.example.com" /></label>
          <div className="settings-card-note"><Database size={14} /><span>Connected integrations must enforce authentication, authorization and policy outside the browser.</span></div>
        </section>

        <section className="admin-settings-card">
          <header><span><Network size={18} /></span><div><h2>Blockchain</h2><p>Network and crypto collateral presentation.</p></div></header>
          <label><span>Chain ID</span><input inputMode="numeric" value={settings.chainId} onChange={(event) => update("chainId", event.target.value.replace(/\D/g, ""))} /></label>
          <label><span>Network</span><input value={settings.network} onChange={(event) => update("network", event.target.value)} /></label>
          <label><span>Collateral asset</span><input value={settings.collateralAsset} onChange={(event) => update("collateralAsset", event.target.value.toUpperCase())} maxLength={8} /></label>
        </section>

        <section className="admin-settings-card">
          <header><span><ShieldCheck size={18} /></span><div><h2>Compliance states</h2><p>Interface gates supplied by the connected integration.</p></div></header>
          <label><span>Geographic gate</span><input value={settings.geographicGate} onChange={(event) => update("geographicGate", event.target.value)} /></label>
          <label><span>Identity status</span><input value={settings.identityStatus} onChange={(event) => update("identityStatus", event.target.value)} /></label>
          <label className="setting-toggle"><span>Risk review<small>Surface elevated integration signals in operations.</small></span><input type="checkbox" checked={settings.riskReview} onChange={(event) => update("riskReview", event.target.checked)} /><i /></label>
        </section>

        <section className="admin-settings-card">
          <header><span><BellRing size={18} /></span><div><h2>Notifications</h2><p>Platform-wide operational event delivery.</p></div></header>
          <label className="setting-toggle"><span>Order events<small>Filled, cancelled and rejected orders.</small></span><input type="checkbox" checked={settings.orderEvents} onChange={(event) => update("orderEvents", event.target.checked)} /><i /></label>
          <label className="setting-toggle"><span>Resolution events<small>Proposal, dispute and approval updates.</small></span><input type="checkbox" checked={settings.resolutionEvents} onChange={(event) => update("resolutionEvents", event.target.checked)} /><i /></label>
          <label className="setting-toggle"><span>System alerts<small>Indexer, pricing and settlement availability.</small></span><input type="checkbox" checked={settings.systemAlerts} onChange={(event) => update("systemAlerts", event.target.checked)} /><i /></label>
        </section>

        <section className="admin-settings-card span-two">
          <header><span><SlidersHorizontal size={18} /></span><div><h2>Market defaults</h2><p>Initial values applied by the market-creation interface.</p></div></header>
          <div className="settings-inline-grid">
            <label><span>Minimum order size</span><div className="input-with-suffix"><input inputMode="decimal" value={settings.minimumOrderSize} onChange={(event) => update("minimumOrderSize", event.target.value)} /><em>{settings.collateralAsset}</em></div></label>
            <label><span>Default tick size</span><div className="input-with-suffix"><input inputMode="decimal" value={settings.tickSize} onChange={(event) => update("tickSize", event.target.value)} /><em>{settings.collateralAsset}</em></div></label>
            <label><span>Dispute window</span><div className="input-with-suffix"><input inputMode="numeric" value={settings.disputeWindow} onChange={(event) => update("disputeWindow", event.target.value.replace(/\D/g, ""))} /><em>hours</em></div></label>
            <label><span>Display timezone</span><select value={settings.timezone} onChange={(event) => update("timezone", event.target.value)}><option value="UTC">UTC</option><option value="Europe/London">Europe/London</option><option value="Asia/Kolkata">Asia/Kolkata</option><option value="America/New_York">America/New_York</option></select></label>
          </div>
        </section>

        <section className="admin-settings-card span-two interface-policy-card">
          <header><span><Globe2 size={18} /></span><div><h2>Interface policy</h2><p>Public-facing availability and maintenance states.</p></div></header>
          <div className="policy-toggle-grid">
            <label className="setting-toggle"><span>Public market discovery<small>Allow unauthenticated visitors to browse markets.</small></span><input type="checkbox" checked={settings.publicDiscovery} onChange={(event) => update("publicDiscovery", event.target.checked)} /><i /></label>
            <label className="setting-toggle"><span>Trading interface enabled<small>Pause order entry during maintenance or integration downtime.</small></span><input type="checkbox" checked={settings.tradingEnabled} onChange={(event) => update("tradingEnabled", event.target.checked)} /><i /></label>
          </div>
          {!settings.tradingEnabled ? <div className="admin-warning-box"><ShieldCheck size={18} /><span><strong>Trading maintenance mode</strong><p>Connected policy data should disable order entry while this state is active.</p></span></div> : null}
        </section>
      </div>
    </AdminShell>
  );
}
