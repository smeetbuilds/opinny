import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { AccountShell } from "@/components/account-shell";
import { OrdersData } from "@/components/account-data";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <SiteShell>
      <div className="page-container inner-page">
        <AccountShell title="Orders" eyebrow="Trading" description="Review open, partially filled and historical orders with real filtering and fill progress.">
          <OrdersData />
        </AccountShell>
      </div>
    </SiteShell>
  );
}
