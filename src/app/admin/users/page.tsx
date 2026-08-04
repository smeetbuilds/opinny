import { Download, MoreHorizontal, Search } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { dataAdapter } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

export default async function AdminUsersPage() {
  const users = await dataAdapter.getUsers();
  return <AdminShell title="Users" description="Account activity, balances, permissions and risk-review states." actions={<button className="secondary-button compact"><Download size={15} />Export</button>}><section className="admin-panel"><div className="admin-table-toolbar"><div className="admin-search"><Search size={16} /><input placeholder="Search handle or wallet" /></div><div className="panel-tabs"><button className="active">All</button><button>Active</button><button>Review</button><button>Suspended</button></div></div><div className="responsive-table"><table><thead><tr><th>User</th><th>Wallet</th><th>Joined</th><th>Volume</th><th>Balance</th><th>Risk</th><th>Status</th><th /></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><div className="trader-cell"><span className="profile-avatar">{user.handle.slice(0, 2).toUpperCase()}</span><span><strong>@{user.handle}</strong><small>{user.id}</small></span></div></td><td className="mono">{user.wallet.slice(0, 10)}…{user.wallet.slice(-4)}</td><td>{user.joined}</td><td>{formatCurrency(user.volume, { compact: true })}</td><td>{formatCurrency(user.balance)}</td><td><span className={`risk-pill ${user.risk}`}>{user.risk}</span></td><td><span className={`status-pill ${user.status}`}>{user.status}</span></td><td><button className="icon-button" aria-label={`Open user actions for ${user.handle}`}><MoreHorizontal size={17} /></button></td></tr>)}</tbody></table></div></section></AdminShell>;
}
