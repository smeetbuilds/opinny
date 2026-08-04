import { AdminShell } from "@/components/admin/admin-shell";
import { AdminUsersConsole } from "@/components/admin/admin-users-console";
import { dataAdapter } from "@/lib/data";

export default async function AdminUsersPage() {
  const users = await dataAdapter.getUsers();
  return <AdminShell title="Users" description="Account activity, balances, permissions and risk-review states."><AdminUsersConsole initialUsers={users} /></AdminShell>;
}
