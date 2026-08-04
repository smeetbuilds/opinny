import { Download, Search } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { dataAdapter } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

export default async function AdminTransactionsPage() {
  const txs = await dataAdapter.getTransactions();
  return <AdminShell title="Transactions" description="Indexed funding, trade, reward and settlement records." actions={<button className="secondary-button compact"><Download size={15} />Export CSV</button>}><section className="admin-panel"><div className="admin-table-toolbar"><div className="admin-search"><Search size={16} /><input placeholder="Search wallet or transaction hash" /></div><div className="panel-tabs"><button className="active">All</button><button>Deposits</button><button>Withdrawals</button><button>Trades</button></div></div><div className="responsive-table"><table><thead><tr><th>ID</th><th>Type</th><th>Wallet</th><th>Asset</th><th>Amount</th><th>Transaction</th><th>Status</th><th>Time</th></tr></thead><tbody>{txs.map((tx) => <tr key={tx.id}><td>{tx.id}</td><td className="capitalize">{tx.type}</td><td className="mono">{tx.wallet}</td><td>{tx.asset}</td><td>{formatCurrency(tx.amount)}</td><td className="mono">{tx.txHash}</td><td><span className={`status-pill ${tx.status}`}>{tx.status}</span></td><td>{tx.time}</td></tr>)}</tbody></table></div></section></AdminShell>;
}
