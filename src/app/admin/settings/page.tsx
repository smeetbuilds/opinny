"use client";

import { BellRing, Database, Globe2, Network, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useApp } from "@/components/app-provider";

const groups = [
  { icon: Database, title: "Data adapter", description: "Transport and market-data connection", fields: [["Adapter", "mock"], ["HTTP endpoint", "Not configured"], ["WebSocket endpoint", "Not configured"]] },
  { icon: Network, title: "Blockchain", description: "Network and collateral presentation", fields: [["Chain ID", "137"], ["Network", "Polygon"], ["Collateral asset", "USDC"]] },
  { icon: ShieldCheck, title: "Compliance states", description: "Frontend gates supplied by your backend", fields: [["Geographic gate", "Backend controlled"], ["Identity status", "Adapter supplied"], ["Risk review", "Enabled"]] },
  { icon: BellRing, title: "Notifications", description: "Platform-wide event delivery settings", fields: [["Order events", "Enabled"], ["Resolution events", "Enabled"], ["System alerts", "Enabled"]] }
];

export default function AdminSettingsPage() {
  const { notify } = useApp();
  return <AdminShell title="Settings" description="Frontend integration and operational presentation settings." actions={<button className="primary-button compact" onClick={() => notify("Settings saved", "Demo configuration has been stored in local UI state.")}>Save changes</button>}><div className="admin-settings-grid">{groups.map(({ icon: Icon, title, description, fields }) => <section className="admin-settings-card" key={title}><header><span><Icon size={18} /></span><div><h2>{title}</h2><p>{description}</p></div></header>{fields.map(([label, value]) => <label key={label}><span>{label}</span><input defaultValue={value} /></label>)}</section>)}<section className="admin-settings-card span-two"><header><span><SlidersHorizontal size={18} /></span><div><h2>Market defaults</h2><p>Initial values applied by the market-creation interface.</p></div></header><div className="settings-inline-grid"><label><span>Minimum order size</span><input defaultValue="5" /></label><label><span>Default tick size</span><input defaultValue="0.01" /></label><label><span>Dispute window</span><input defaultValue="24 hours" /></label><label><span>Display timezone</span><input defaultValue="UTC" /></label></div></section><section className="admin-settings-card span-two"><header><span><Globe2 size={18} /></span><div><h2>Interface policy</h2><p>Public-facing availability and maintenance states.</p></div></header><label className="setting-toggle"><span>Public market discovery<small>Allow unauthenticated visitors to browse markets.</small></span><input type="checkbox" defaultChecked /><i /></label><label className="setting-toggle"><span>Trading interface enabled<small>Hide order entry during maintenance or backend downtime.</small></span><input type="checkbox" defaultChecked /><i /></label></section></div></AdminShell>;
}
