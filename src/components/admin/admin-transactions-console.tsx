"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Copy, Download, Search, X } from "lucide-react";
import type { TransactionRecord } from "@/core/contracts/domain";
import { formatCurrency } from "@/lib/format";
import { useApp } from "@/components/app-provider";

type TypeFilter = "all" | TransactionRecord["type"];
type StatusFilter = "all" | TransactionRecord["status"];
type SortMode = "newest" | "amount" | "attention";

function downloadCsv(transactions: TransactionRecord[]) {
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  const rows = [["ID", "Type", "Wallet", "Asset", "Amount", "Transaction", "Status", "Time"], ...transactions.map((tx) => [tx.id, tx.type, tx.wallet, tx.asset, tx.amount, tx.txHash, tx.status, tx.time])];
  const blob = new Blob([rows.map((row) => row.map(escape).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `opinny-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AdminTransactionsConsole({ transactions }: { transactions: TransactionRecord[] }) {
  const { notify } = useApp();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortMode>("newest");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return transactions
      .filter((tx) => type === "all" || tx.type === type)
      .filter((tx) => status === "all" || tx.status === status)
      .filter((tx) => !normalized || [tx.id, tx.wallet, tx.txHash, tx.asset].some((value) => value.toLowerCase().includes(normalized)))
      .sort((a, b) => sort === "amount" ? b.amount - a.amount : sort === "attention" ? Number(b.status !== "confirmed") - Number(a.status !== "confirmed") : 0);
  }, [transactions, query, type, status, sort]);

  async function copy(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    notify(`${label} copied`, value);
  }

  const inflow = transactions.filter((tx) => tx.type === "deposit" || tx.type === "reward").reduce((sum, tx) => sum + tx.amount, 0);
  const outflow = transactions.filter((tx) => tx.type === "withdrawal").reduce((sum, tx) => sum + tx.amount, 0);
  const attention = transactions.filter((tx) => tx.status !== "confirmed").length;

  return (
    <>
      <div className="admin-page-kpis" aria-label="Transaction summary"><article><span>Indexed volume</span><strong>{formatCurrency(transactions.reduce((sum, tx) => sum + tx.amount, 0), { compact: true })}</strong><small>{transactions.length} recent records</small></article><article><span>Funding flow</span><strong className="positive">+{formatCurrency(inflow, { compact: true })}</strong><small>{formatCurrency(outflow, { compact: true })} withdrawals</small></article><article><span>Needs attention</span><strong>{attention}</strong><small>{transactions.filter((tx) => tx.status === "failed").length} failed · {transactions.filter((tx) => tx.status === "pending").length} pending</small></article></div>
      <section className="admin-panel admin-console-panel">
        <div className="admin-console-head"><div><span className="eyebrow">Ledger activity</span><h2>Transaction explorer</h2><p>Inspect funding, trading and reward records indexed by the adapter.</p></div><button type="button" className="secondary-button compact" onClick={() => { downloadCsv(filtered); notify("CSV exported", `${filtered.length} transactions downloaded.`); }}><Download size={15} />Export {filtered.length}</button></div>
        <div className="admin-table-toolbar admin-toolbar-rich"><label className="admin-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search wallet, hash, ID or asset" aria-label="Search transactions" />{query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear transaction search"><X size={14} /></button> : null}</label><div className="admin-filter-row"><label className="admin-select-control"><span>Type</span><select value={type} onChange={(event) => setType(event.target.value as TypeFilter)}><option value="all">All types</option><option value="deposit">Deposits</option><option value="withdrawal">Withdrawals</option><option value="trade">Trades</option><option value="reward">Rewards</option></select></label><label className="admin-select-control"><span>Status</span><select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}><option value="all">All statuses</option><option value="confirmed">Confirmed</option><option value="pending">Pending</option><option value="failed">Failed</option></select></label><label className="admin-select-control"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}><option value="newest">Latest indexed</option><option value="amount">Largest amount</option><option value="attention">Attention first</option></select></label></div></div>
        <div className="admin-results-line"><span><strong>{filtered.length}</strong> transaction records</span>{query || type !== "all" || status !== "all" ? <button type="button" className="text-button" onClick={() => { setQuery(""); setType("all"); setStatus("all"); }}>Reset filters</button> : null}</div>
        {filtered.length ? <div className="responsive-table admin-responsive-table"><table><thead><tr><th>ID</th><th>Type</th><th>Wallet</th><th>Asset</th><th>Amount</th><th>Transaction</th><th>Status</th><th>Time</th></tr></thead><tbody>{filtered.map((tx) => <tr key={tx.id}><td data-label="ID"><strong>{tx.id}</strong></td><td data-label="Type" className="capitalize">{tx.type}</td><td data-label="Wallet"><button type="button" className="admin-copy-value mono" onClick={() => copy(tx.wallet, "Wallet")}>{tx.wallet}<Copy size={12} /></button></td><td data-label="Asset">{tx.asset}</td><td data-label="Amount"><strong>{formatCurrency(tx.amount)}</strong></td><td data-label="Transaction"><button type="button" className="admin-copy-value mono" onClick={() => copy(tx.txHash, "Transaction hash")}>{tx.txHash}<Copy size={12} /></button></td><td data-label="Status"><span className={`status-pill ${tx.status}`}>{tx.status === "confirmed" ? <CheckCircle2 size={12} /> : tx.status === "failed" ? <AlertTriangle size={12} /> : null}{tx.status}</span></td><td data-label="Time">{tx.time}</td></tr>)}</tbody></table></div> : <div className="admin-empty-state"><Search size={22} /><h3>No transactions match</h3><p>Try removing a transaction type or status constraint.</p><button type="button" className="secondary-button compact" onClick={() => { setQuery(""); setType("all"); setStatus("all"); }}>Reset filters</button></div>}
      </section>
    </>
  );
}
