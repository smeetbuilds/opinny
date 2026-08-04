import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const metadata: Metadata = { title: "Terms" };

const sections = [
  { id: "platform", title: "Platform use", paragraphs: ["Opinny provides an interface for exploring event markets and preparing crypto-based market, order and funding actions. Access to execution, custody, settlement and account services depends on the connected operator, smart contracts and integration services."] },
  { id: "eligibility", title: "Eligibility and lawful use", paragraphs: ["You must comply with applicable laws, operator requirements and jurisdictional restrictions. Do not use the platform for unlawful activity, market manipulation, abuse, sanctions evasion or interference with other users."] },
  { id: "wallet", title: "Wallet responsibility", paragraphs: ["You control wallet approvals and are responsible for checking transaction details. The platform does not ask for private keys or recovery phrases. Transactions may be irreversible once submitted to a blockchain network."] },
  { id: "markets", title: "Markets and resolution", paragraphs: ["Market questions, rules, sources, prices, liquidity and resolution states can change. Review the full market rules before trading. The connected operator determines authoritative market creation, moderation, dispute and resolution processes."] },
  { id: "availability", title: "Availability and changes", paragraphs: ["Features may be paused, changed or unavailable because of maintenance, network conditions, operator decisions or legal requirements. Interface data may be delayed or incomplete and should be verified before approving a transaction."] }
];

export default function TermsPage() {
  return <PolicyPage eyebrow="Platform terms" title="Terms" intro="Conditions for using the Opinny market interface and connected crypto services." updated="Updated August 5, 2026" sections={sections} />;
}
