import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CircleDollarSign, HelpCircle, ShieldCheck, WalletCards } from "lucide-react";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = { title: "Help centre" };

const faqs = [
  ["What does a market price mean?", "A 64¢ outcome price represents a market-implied probability near 64%. It is a tradable price, not a guarantee."],
  ["What is the difference between market and limit orders?", "Market orders prioritize immediate execution against available liquidity. Limit orders only execute at your selected price or better."],
  ["How are markets resolved?", "Each market publishes rules and a primary source. The connected operator reviews evidence, disputes and the final outcome."],
  ["Can I pay by card or bank transfer?", "No. Opinny is designed for crypto-only wallet funding and withdrawals. Supported assets and networks are shown before a request is prepared."],
  ["Does connecting a wallet give the platform custody?", "No. The interface prepares wallet requests, but you review and approve transactions in the connected wallet."],
  ["Why can an order fill partially?", "A limit order can match only the available liquidity at its price. The remaining quantity stays open until matched or cancelled." ]
];

export default function HelpPage() {
  return (
    <SiteShell>
      <div className="page-container help-page">
        <header className="help-hero"><span className="eyebrow">Support</span><h1>Help centre</h1><p>Understand market prices, order types, crypto funding and resolution workflows.</p></header>
        <div className="help-topic-grid">
          <Link href="/markets"><span><BookOpen size={19} /></span><strong>Markets</strong><small>Discovery, prices and outcomes</small><ArrowRight size={16} /></Link>
          <Link href="/portfolio"><span><CircleDollarSign size={19} /></span><strong>Trading</strong><small>Orders, positions and P&amp;L</small><ArrowRight size={16} /></Link>
          <Link href="/settings"><span><WalletCards size={19} /></span><strong>Wallets</strong><small>Connection and crypto funding</small><ArrowRight size={16} /></Link>
          <Link href="/risk"><span><ShieldCheck size={19} /></span><strong>Safety</strong><small>Market and wallet risks</small><ArrowRight size={16} /></Link>
        </div>
        <section className="faq-section"><div className="section-heading-row"><div><span className="eyebrow">Common questions</span><h2>Frequently asked</h2></div><HelpCircle size={22} /></div><div className="faq-grid">{faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
        <section className="help-safety-card"><ShieldCheck size={24} /><div><strong>Wallet safety</strong><p>Opinny never asks for a private key or recovery phrase. Verify the network, asset, destination and transaction request before approving.</p></div><Link href="/risk">Read risk disclosure <ArrowRight size={15} /></Link></section>
      </div>
    </SiteShell>
  );
}
