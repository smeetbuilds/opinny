"use client";

import { useMemo, useState } from "react";
import { Copy, Download, Search, ShieldAlert, X } from "lucide-react";
import type { AdminUser } from "@/core/contracts/domain";
import { dataAdapter } from "@/lib/data";
import { formatCurrency } from "@/lib/format";
import { useApp } from "@/components/app-provider";

type StatusFilter = "all" | AdminUser["status"];
type RiskFilter = "all" | AdminUser["risk"];
type SortMode = "volume" | "balance" | "risk";

const riskWeight: Record<AdminUser["risk"], number> = { low: 0, medium: 1, high: 2 };

function downloadCsv(users: AdminUser[]) {
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  const rows = [["ID", "Handle", "Wallet", "Joined", "Volume", "Balance", "Risk", "Status"], ...users.map((user) => [user.id, user.handle, user.wallet, user.joined, user.volume, user.balance, user.risk, user.status])];
  const blob = new Blob([rows.map((row) => row.map(escape).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `opinny-users-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AdminUsersConsole({ initialUsers }: { initialUsers: AdminUser[] }) {
  const { notify } = useApp();
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [risk, setRisk] = useState<RiskFilter>("all");
  const [sort, setSort] = useState<SortMode>("volume");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return users
      .filter((user) => status === "all" || user.status === status)
      .filter((user) => risk === "all" || user.risk === risk)
      .filter((user) => !normalized || [user.handle, user.wallet, user.id].some((value) => value.toLowerCase().includes(normalized)))
      .sort((a, b) => sort === "balance" ? b.balance - a.balance : sort === "risk" ? riskWeight[b.risk] - riskWeight[a.risk] : b.volume - a.volume);
  }, [users, query, status, risk, sort]);

  const statusCounts = useMemo(() => ({
    all: users.length,
    active: users.filter((user) => user.status === "active").length,
    review: users.filter((user) => user.status === "review").length,
    suspended: users.filter((user) => user.status === "suspended").length
  }), [users]);

  async function updateStatus(user: AdminUser, nextStatus: AdminUser["status"]) {
    if (nextStatus === user.status) return;
    setPendingId(user.id);
    try {
      const result = await dataAdapter.updateUserStatus(user.id, nextStatus);
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, status: nextStatus } : item));
      notify("User status updated", result.message);
    } finally {
      setPendingId(null);
    }
  }

  async function copyWallet(wallet: string) {
    await navigator.clipboard.writeText(wallet);
    notify("Wallet copied", wallet);
  }

  return (
    <>
      <div className="admin-page-kpis" aria-label="User operational summary">
        <article><span>Registered users</span><strong>{users.length}</strong><small>{statusCounts.active} active accounts</small></article>
        <article><span>Custodied balance</span><strong>{formatCurrency(users.reduce((sum, user) => sum + user.balance, 0), { compact: true })}</strong><small>Mock adapter total</small></article>
        <article><span>Risk attention</span><strong>{users.filter((user) => user.risk !== "low").length}</strong><small>{users.filter((user) => user.risk === "high").length} high-risk accounts</small></article>
      </div>
      <section className="admin-panel admin-console-panel">
        <div className="admin-console-head"><div><span className="eyebrow">Account operations</span><h2>User directory</h2><p>Review account health, balances, risk signals and access state.</p></div><button className="secondary-button compact" type="button" onClick={() => { downloadCsv(filtered); notify("CSV exported", `${filtered.length} user records downloaded.`); }}><Download size={15} />Export {filtered.length}</button></div>
        <div className="admin-table-toolbar admin-toolbar-rich"><label className="admin-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search handle, wallet or ID" aria-label="Search users" />{query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear user search"><X size={14} /></button> : null}</label><div className="admin-filter-row"><div className="panel-tabs" aria-label="Filter users by account status">{(["all", "active", "review", "suspended"] as StatusFilter[]).map((value) => <button type="button" className={status === value ? "active" : ""} onClick={() => setStatus(value)} key={value}>{value}<span>{statusCounts[value]}</span></button>)}</div><label className="admin-select-control"><span>Risk</span><select value={risk} onChange={(event) => setRisk(event.target.value as RiskFilter)}><option value="all">All risk levels</option><option value="high">High risk</option><option value="medium">Medium risk</option><option value="low">Low risk</option></select></label><label className="admin-select-control"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="volume">Highest volume</option><option value="balance">Highest balance</option><option value="risk">Highest risk</option></select></label></div></div>
        <div className="admin-results-line"><span><strong>{filtered.length}</strong> accounts shown</span>{query || status !== "all" || risk !== "all" ? <button className="text-button" type="button" onClick={() => { setQuery(""); setStatus("all"); setRisk("all"); }}>Reset filters</button> : null}</div>
        {filtered.length ? <div className="responsive-table admin-responsive-table"><table><thead><tr><th>User</th><th>Wallet</th><th>Joined</th><th>Volume</th><th>Balance</th><th>Risk</th><th>Access state</th></tr></thead><tbody>{filtered.map((user) => <tr key={user.id}><td data-label="User"><div className="trader-cell"><span className="profile-avatar">{user.handle.slice(0, 2).toUpperCase()}</span><span><strong>@{user.handle}</strong><small>{user.id}</small></span></div></td><td data-label="Wallet"><button type="button" className="admin-copy-value mono" onClick={() => copyWallet(user.wallet)} title="Copy full wallet">{user.wallet.slice(0, 8)}…{user.wallet.slice(-4)}<Copy size={12} /></button></td><td data-label="Joined">{user.joined}</td><td data-label="Volume">{formatCurrency(user.volume, { compact: true })}</td><td data-label="Balance">{formatCurrency(user.balance)}</td><td data-label="Risk"><span className={`risk-pill ${user.risk}`}>{user.risk === "high" ? <ShieldAlert size={12} /> : null}{user.risk}</span></td><td data-label="Access state"><select className={`admin-inline-select status-${user.status}`} value={user.status} disabled={pendingId === user.id} onChange={(event) => updateStatus(user, event.target.value as AdminUser["status"])} aria-label={`Change status for ${user.handle}`}><option value="active">Active</option><option value="review">Review</option><option value="suspended">Suspended</option></select></td></tr>)}</tbody></table></div> : <div className="admin-empty-state"><Search size={22} /><h3>No accounts match</h3><p>Adjust the status, risk or search filters to see more users.</p><button type="button" className="secondary-button compact" onClick={() => { setQuery(""); setStatus("all"); setRisk("all"); }}>Reset filters</button></div>}
      </section>
    </>
  );
}
