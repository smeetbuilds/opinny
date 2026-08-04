import type { Metadata } from "next";
import { PolicyPage } from "@/components/policy-page";

export const metadata: Metadata = { title: "Privacy" };

const sections = [
  { id: "information", title: "Information used by the interface", paragraphs: ["The interface may process wallet addresses, market interactions, preferences, watchlists and device-level information required to provide account and market experiences. Wallet addresses and onchain transactions are generally public by design."], bullets: ["Connected wallet address and network state.", "Locally stored interface preferences and watchlists.", "Market, order and funding data returned by the connected integration adapter."] },
  { id: "storage", title: "Local storage", paragraphs: ["Opinny stores selected preferences, watchlist state and interface settings in the browser. Clearing browser storage removes those local preferences. An operator may add separate account storage through its backend implementation."] },
  { id: "integrations", title: "Wallets and external integrations", paragraphs: ["Wallet providers, blockchain networks, analytics services and backend operators may process information under their own policies. Review those policies before connecting or approving a transaction."] },
  { id: "controls", title: "Your controls", paragraphs: ["You can disconnect a wallet, clear notification state, reset local preferences and remove browser storage. Backend account requests must be handled by the operator connected to the frontend."] }
];

export default function PrivacyPage() {
  return <PolicyPage eyebrow="Information policy" title="Privacy" intro="How the platform interface handles wallet, market and preference data." updated="Updated August 5, 2026" sections={sections} />;
}
