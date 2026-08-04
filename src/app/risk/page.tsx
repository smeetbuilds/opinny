import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const metadata: Metadata = { title: "Risk disclosure" };

const sections = [
  { id: "market-risk", title: "Market risk", paragraphs: ["Prediction-market prices can move quickly and may be affected by new information, liquidity, participant behaviour and resolution expectations. A displayed probability is a market price, not a guarantee of an outcome."], bullets: ["You may lose some or all crypto committed to a position.", "Past performance, trader rankings and historical prices do not predict future results.", "Thin liquidity can increase spread, price impact and execution uncertainty."] },
  { id: "wallet-risk", title: "Wallet and network risk", paragraphs: ["Opinny uses wallet-approved crypto transaction states. Blockchain transactions may be irreversible, delayed, rejected or subject to network fees."], bullets: ["Verify the wallet address, asset and network before signing.", "Never share a recovery phrase, private key or wallet password.", "Unsupported assets or networks may result in permanent loss."] },
  { id: "resolution-risk", title: "Resolution risk", paragraphs: ["Markets resolve according to their published rules and sources. Ambiguous events, delayed source data and disputes can postpone or affect settlement."], bullets: ["Review the resolution source and rules before trading.", "Market titles are summaries; the detailed rules control resolution.", "Dispute and review processes depend on the connected operator or backend."] },
  { id: "availability", title: "Availability and eligibility", paragraphs: ["Market access can be limited by jurisdiction, operator policy, wallet status, identity requirements or technical availability. Users are responsible for determining whether participation is permitted where they are located."] }
];

export default function RiskPage() {
  return <PolicyPage eyebrow="Important information" title="Risk disclosure" intro="Understand market, wallet, liquidity and resolution risks before trading event outcomes." updated="Updated August 5, 2026" sections={sections} />;
}
