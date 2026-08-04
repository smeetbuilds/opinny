import { AdminShell } from "@/components/admin/admin-shell";
import { AdminTransactionsConsole } from "@/components/admin/admin-transactions-console";
import { dataAdapter } from "@/lib/data";

export default async function AdminTransactionsPage() {
  const transactions = await dataAdapter.getTransactions();
  return <AdminShell title="Transactions" description="Indexed funding, trade, reward and settlement records."><AdminTransactionsConsole transactions={transactions} /></AdminShell>;
}
