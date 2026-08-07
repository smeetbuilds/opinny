import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock3, ShieldAlert, UsersRound } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { CategoryBreakdown, VolumeChart } from "@/components/admin/admin-charts";
import { dataAdapter } from "@/lib/data";

export default async function AdminOverviewPage() {
  const [metrics, resolutions, users, transactions] = await Promise.all([
    dataAdapter.getMetrics(),
    dataAdapter.getResolutionQueue(),
    dataAdapter.getUsers(),
    dataAdapter.getTransactions()
  ]);
  const attentionCases = resolutions.filter((item) => item.status === "awaiting" || item.status === "disputed").length;
  const elevatedUsers = users.filter((user) => user.risk !== "low").length;
  const pendingTransactions = transactions.filter((tx) => tx.status === "pending" || tx.status === "failed").length;

  return (
    <AdminShell title="Overview" description="Market operations, account review and settlement activity." actions={<Link className="primary-button compact" href="/admin/markets">Manage markets</Link>}>
      <div className="admin-attention-bar">
        <div><CheckCircle2 size={18} /><span><strong>Operational review</strong><small>Review the resolution, risk and transaction queues supplied by the connected integration.</small></span></div>
        <Link href="/admin/resolutions"><Clock3 size={16} /><span>Resolution review</span><strong>{attentionCases}</strong></Link>
        <Link href="/admin/users"><ShieldAlert size={16} /><span>Elevated-risk users</span><strong>{elevatedUsers}</strong></Link>
        <Link href="/admin/transactions"><AlertTriangle size={16} /><span>Transaction attention</span><strong>{pendingTransactions}</strong></Link>
      </div>

      <div className="admin-metric-grid">{metrics.map((metric, index) => (
        <article key={metric.label}>
          <div><span>{metric.label}</span>{index === 2 ? <UsersRound size={18} /> : index === 3 ? <ShieldAlert size={18} /> : <ArrowUpRight size={18} />}</div>
          <strong>{metric.value}</strong>
          <em className={metric.change >= 0 ? "positive" : "negative"}>{metric.change >= 0 ? "+" : ""}{metric.change}% <small>vs prior period</small></em>
          <small>{metric.hint}</small>
        </article>
      ))}</div>

      <div className="admin-dashboard-grid"><VolumeChart /><CategoryBreakdown /></div>

      <div className="admin-dashboard-grid lower-grid">
        <section className="admin-panel">
          <div className="table-title"><div><h2>Resolution queue</h2><span>Markets requiring operational review</span></div><Link href="/admin/resolutions">View all <ArrowUpRight size={13} /></Link></div>
          <div className="admin-list">{resolutions.slice(0, 4).map((item) => <article key={item.id}><span className={`status-dot-large ${item.status}`}><Clock3 size={15} /></span><div><strong>{item.market}</strong><small>{item.proposedOutcome} · {item.source}</small></div><span className={`status-pill ${item.status}`}>{item.status}</span></article>)}</div>
        </section>
        <section className="admin-panel">
          <div className="table-title"><div><h2>Risk review</h2><span>Accounts with elevated signals</span></div><Link href="/admin/users">View all <ArrowUpRight size={13} /></Link></div>
          <div className="admin-list">{users.filter((user) => user.risk !== "low").map((user) => <article key={user.id}><span className="profile-avatar">{user.handle.slice(0, 2).toUpperCase()}</span><div><strong>@{user.handle}</strong><small>{user.wallet.slice(0, 10)}… · ${Math.round(user.volume / 1000)}K volume</small></div><span className={`risk-pill ${user.risk}`}>{user.risk}</span></article>)}</div>
        </section>
      </div>

      <section className="admin-panel transaction-preview" aria-labelledby="recent-admin-transactions">
        <div className="table-title"><div><h2 id="recent-admin-transactions">Recent transactions</h2><span>Latest indexed platform activity</span></div><Link href="/admin/transactions">View all <ArrowUpRight size={13} /></Link></div>
        <div className="responsive-table admin-data-table">
          <table>
            <thead><tr><th>Type</th><th>Wallet</th><th>Asset</th><th>Amount</th><th>Status</th><th>Time</th></tr></thead>
            <tbody>{transactions.map((tx) => <tr key={tx.id}><td data-label="Type" className="capitalize">{tx.type}</td><td data-label="Wallet" className="mono">{tx.wallet}</td><td data-label="Asset">{tx.asset}</td><td data-label="Amount">${tx.amount.toLocaleString()}</td><td data-label="Status"><span className={`status-pill ${tx.status}`}>{tx.status}</span></td><td data-label="Time">{tx.time}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
