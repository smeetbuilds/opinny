import Link from "next/link";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { appConfig } from "@/lib/config";
import { SiteShell } from "./site-shell";

export type PolicySection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export function PolicyPage({ eyebrow, title, intro, updated, sections }: { eyebrow: string; title: string; intro: string; updated: string; sections: PolicySection[] }) {
  return (
    <SiteShell>
      <div className="page-container policy-page">
        <nav className="breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><ChevronRight size={14} /><span aria-current="page">{title}</span></nav>
        <header className="policy-hero"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{intro}</p><time>{updated}</time></header>
        {appConfig.adapter === "mock" ? <aside className="policy-paper-note" aria-label="Paper simulation scope"><ShieldCheck size={20} aria-hidden="true" /><p><strong>Paper-mode demonstration.</strong> This site uses browser-local simulated balances and does not accept real deposits or execute blockchain transactions. References below to wallets, operators or crypto transactions describe possible production integrations, not current paper-mode functionality.</p></aside> : null}
        <div className="policy-layout">
          <aside><strong>On this page</strong>{sections.map((section) => <a href={`#${section.id}`} key={section.id}>{section.title}</a>)}</aside>
          <article className="policy-content">
            {sections.map((section) => <section id={section.id} key={section.id}><h2>{section.title}</h2>{section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.bullets ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}</section>)}
          </article>
        </div>
      </div>
    </SiteShell>
  );
}
