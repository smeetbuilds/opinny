import { AdminShell } from "@/components/admin/admin-shell";
import { AdminMarketsConsole } from "@/components/admin/admin-markets-console";
import { dataAdapter } from "@/lib/data";

export default async function AdminMarketsPage() {
  const markets = await dataAdapter.listMarkets();
  return <AdminShell title="Markets" description="Create, moderate, pause and inspect platform markets."><AdminMarketsConsole initialMarkets={markets} /></AdminShell>;
}
