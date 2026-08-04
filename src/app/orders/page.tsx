import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { AccountShell } from "@/components/account-shell";
import { OrdersTable } from "@/components/orders-table";
import { dataAdapter } from "@/lib/data";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage() {
  const orders = await dataAdapter.getOrders();
  return (
    <SiteShell>
      <div className="page-container inner-page">
        <AccountShell title="Orders" eyebrow="Trading" description="Review open, partially filled and historical orders with real filtering and fill progress.">
          <OrdersTable orders={orders} />
        </AccountShell>
      </div>
    </SiteShell>
  );
}
