import { AdminShell } from "@/components/admin/admin-shell";
import { AdminResolutionsConsole } from "@/components/admin/admin-resolutions-console";
import { dataAdapter } from "@/lib/data";

export default async function AdminResolutionsPage() {
  const cases = await dataAdapter.getResolutionQueue();
  return <AdminShell title="Resolutions" description="Review evidence, proposed outcomes and dispute windows."><AdminResolutionsConsole initialCases={cases} /></AdminShell>;
}
