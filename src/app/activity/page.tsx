import type { Metadata } from "next";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Gift, Repeat2 } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { AccountShell } from "@/components/account-shell";
import { dataAdapter } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

export const metadata: Metadata = { title: "Activity" };
const icons = { trade: Repeat2, deposit: ArrowDownLeft, withdrawal: ArrowUpRight, resolution: CheckCircle2, reward: Gift };

export default async function ActivityPage() {
  const activity = await dataAdapter.getActivity();
  return <SiteShell><div className="page-container inner-page"><AccountShell title="Activity" eyebrow="Timeline" description="Wallet funding, trades, rewards and market settlements."><section className="activity-panel"><div className="activity-filter-row"><button className="active">All activity</button><button>Trades</button><button>Funding</button><button>Rewards</button></div><div className="activity-list">{activity.map((item) => { const Icon = icons[item.type]; return <article key={item.id}><span className={`activity-icon ${item.type}`}><Icon size={17} /></span><div><strong>{item.title}</strong><span>{item.description}</span></div>{item.amount !== undefined ? <em className={item.amount >= 0 ? "positive" : ""}>{item.amount >= 0 ? "+" : "−"}{formatCurrency(Math.abs(item.amount))}</em> : null}<time>{item.time}</time></article>; })}</div></section></AccountShell></div></SiteShell>;
}
