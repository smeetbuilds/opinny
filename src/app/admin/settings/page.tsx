"use client";

import { useEffect, useState } from "react";
import { BellRing, CheckCircle2, Database, Globe2, Network, RotateCcw, Save, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useApp } from "@/components/app-provider";
import { appConfig } from "@/lib/config";

function adapterLabel(value: string) {
  if (value === "mock") return "Reference";
  if (value === "rest") return "REST";
  if (value === "graphql") return "GraphQL";
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "Custom";
}

export default function AdminSettingsPage() {
  const { notify, tradingEnabled, setTradingEnabled } = useApp();
  const [draftTradingEnabled, setDraftTradingEnabled] = useState(tradingEnabled);

  useEffect(() => setDraftTradingEnabled(tradingEnabled), [tradingEnabled]);
  const dirty = draftTradingEnabled !== tradingEnabled;

  function save() {
    setTradingEnabled(draftTradingEnabled);
    notify("Interface policy saved", `Trading entry is now ${draftTradingEnabled ? "enabled" : "paused"} in this browser reference session.`, "system");
  }

  function reset() {
    setDraftTradingEnabled(true);
    setTradingEnabled(true);
    notify("Interface policy reset", "Trading entry was restored for this browser reference session.", "system");
  }

  const actions = <div className="admin-settings-actions"><span className={`save-state ${dirty ? "dirty" : "saved"}`}>{dirty ? "Unsaved changes" : "All changes saved"}</span><button className="secondary-button compact" type="button" onClick={reset}><RotateCcw size={14} />Reset</button><button className="primary-button compact" type="button" disabled={!dirty} onClick={save}><Save size={14} />Save changes</button></div>;

  return (
    <AdminShell title="Settings" description="Integration configuration and reference interface policy." actions={actions}>
      <div className="settings-health-strip">
        <div><CheckCircle2 size={18} /><span><strong>Configuration profile</strong><small>{adapterLabel(appConfig.adapter)} integration profile</small></span></div>
        <span>Network <strong>{appConfig.chainName}</strong></span>
        <span>Collateral <strong>{appConfig.collateral}</strong></span>
        <span>Trading <strong>{draftTradingEnabled ? "Enabled" : "Paused"}</strong></span>
      </div>

      <div className="admin-settings-grid enhanced-settings-grid">
        <section className="admin-settings-card">
          <header><span><Database size={18} /></span><div><h2>Data integration</h2><p>Deployment-defined transport and market-data connection.</p></div></header>
          <label><span>Integration profile</span><select value={appConfig.adapter} disabled><option value={appConfig.adapter}>{adapterLabel(appConfig.adapter)} adapter</option></select></label>
          <label><span>HTTP endpoint</span><input value={appConfig.apiUrl || "Not configured"} readOnly /></label>
          <label><span>WebSocket endpoint</span><input value={appConfig.webSocketUrl || "Not configured"} readOnly /></label>
          <div className="settings-card-note"><Database size={14} /><span>Adapter selection and endpoints are build/deployment configuration. They cannot be safely changed from browser state.</span></div>
        </section>

        <section className="admin-settings-card">
          <header><span><Network size={18} /></span><div><h2>Blockchain</h2><p>Deployment-defined network and crypto collateral presentation.</p></div></header>
          <label><span>Chain ID</span><input value={String(appConfig.chainId)} readOnly /></label>
          <label><span>Network</span><input value={appConfig.chainName} readOnly /></label>
          <label><span>Collateral asset</span><input value={appConfig.collateral} readOnly /></label>
        </section>

        <section className="admin-settings-card">
          <header><span><ShieldCheck size={18} /></span><div><h2>Compliance states</h2><p>Authoritative gates must be supplied by the connected integration.</p></div></header>
          <label><span>Geographic gate</span><input value="Backend controlled" readOnly /></label>
          <label><span>Identity status</span><input value="Adapter supplied" readOnly /></label>
          <label className="setting-toggle"><span>Risk review<small>Read-only reference presentation; production policy is server-side.</small></span><input type="checkbox" checked disabled readOnly /><i /></label>
        </section>

        <section className="admin-settings-card">
          <header><span><BellRing size={18} /></span><div><h2>Operational notifications</h2><p>Production delivery is configured by the connected integration.</p></div></header>
          <label className="setting-toggle"><span>Order events<small>Integration controlled.</small></span><input type="checkbox" checked disabled readOnly /><i /></label>
          <label className="setting-toggle"><span>Resolution events<small>Integration controlled.</small></span><input type="checkbox" checked disabled readOnly /><i /></label>
          <label className="setting-toggle"><span>System alerts<small>Integration controlled.</small></span><input type="checkbox" checked disabled readOnly /><i /></label>
        </section>

        <section className="admin-settings-card span-two">
          <header><span><SlidersHorizontal size={18} /></span><div><h2>Market defaults</h2><p>Authoritative defaults belong to the market-creation integration.</p></div></header>
          <div className="settings-inline-grid">
            <label><span>Minimum order size</span><div className="input-with-suffix"><input value="Integration supplied" readOnly /><em>{appConfig.collateral}</em></div></label>
            <label><span>Default tick size</span><div className="input-with-suffix"><input value="Integration supplied" readOnly /><em>{appConfig.collateral}</em></div></label>
            <label><span>Dispute window</span><div className="input-with-suffix"><input value="Integration supplied" readOnly /><em>hours</em></div></label>
            <label><span>Display timezone</span><select value="UTC" disabled><option value="UTC">UTC</option></select></label>
          </div>
        </section>

        <section className="admin-settings-card span-two interface-policy-card">
          <header><span><Globe2 size={18} /></span><div><h2>Reference interface policy</h2><p>Browser-only presentation control for testing maintenance state. It is not an authorization boundary.</p></div></header>
          <div className="policy-toggle-grid">
            <label className="setting-toggle"><span>Public market discovery<small>Deployment-defined in this frontend-only reference build.</small></span><input type="checkbox" checked={appConfig.features.marketDiscovery} disabled readOnly /><i /></label>
            <label className="setting-toggle"><span>Trading interface enabled<small>Pause order entry in this browser reference session.</small></span><input type="checkbox" checked={draftTradingEnabled} onChange={(event) => setDraftTradingEnabled(event.target.checked)} /><i /></label>
          </div>
          {!draftTradingEnabled ? <div className="admin-warning-box"><ShieldCheck size={18} /><span><strong>Reference maintenance mode</strong><p>Trade tickets are disabled in this browser session. Production policy still belongs to the connected integration.</p></span></div> : null}
        </section>
      </div>
    </AdminShell>
  );
}
