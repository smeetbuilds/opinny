import type { Metadata } from "next";
import Link from "next/link";
import { Award, Flame, Medal, Trophy } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { dataAdapter } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

export const metadata: Metadata = { title: "Leaderboard" };

export default async function LeaderboardPage() {
  const entries = await dataAdapter.getLeaderboard();
  return <SiteShell><div className="page-container inner-page"><header className="page-hero leaderboard-hero"><span className="eyebrow">Top forecasters</span><h1>Leaderboard</h1><p>Ranked by realised profit across settled and closed positions.</p><div className="leaderboard-filters"><button className="active">Monthly</button><button>Weekly</button><button>All time</button><button>Politics</button><button>Crypto</button></div></header><div className="podium-grid">{entries.slice(0, 3).map((entry, index) => <article className={`podium-card place-${index + 1}`} key={entry.handle}><span className="podium-icon">{index === 0 ? <Trophy size={22} /> : index === 1 ? <Medal size={22} /> : <Award size={22} />}</span><span className="profile-avatar xl-avatar">{entry.initials}</span><strong>{entry.displayName}</strong><small>@{entry.handle}</small><em>{formatCurrency(entry.profit)}</em><span>Realised profit</span><div><b>{formatCurrency(entry.volume, { compact: true })}<small>Volume</small></b><b>{entry.accuracy}%<small>Accuracy</small></b></div></article>)}</div><section className="data-panel leaderboard-table"><div className="table-title"><div><h2>Global ranking</h2><span>Updated from settled market data</span></div></div><div className="responsive-table"><table><thead><tr><th>Rank</th><th>Trader</th><th>Profit</th><th>Volume</th><th>Accuracy</th><th>Winning streak</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.handle}><td><strong>#{entry.rank}</strong></td><td><Link className="trader-cell" href={`/profile/${entry.handle}`}><span className="profile-avatar">{entry.initials}</span><span><strong>{entry.displayName}</strong><small>@{entry.handle}</small></span></Link></td><td className="positive">+{formatCurrency(entry.profit)}</td><td>{formatCurrency(entry.volume, { compact: true })}</td><td>{entry.accuracy}%</td><td><span className="streak"><Flame size={15} />{entry.streak}</span></td></tr>)}</tbody></table></div></section></div></SiteShell>;
}
