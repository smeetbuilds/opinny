import { Header } from "./header";
import { MobileNavigation } from "./mobile-navigation";
import { SiteFooter } from "./site-footer";
import { appConfig } from "@/lib/config";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Header />
      {appConfig.adapter === "mock" ? <div className="paper-banner" role="status"><div className="page-container paper-banner-inner"><span className="paper-mode-mark"><i /> PAPER MODE</span><span>Trade events with simulated USDC. No real funds, blockchain orders or live prices.</span><span className="paper-device-note">Saved on this device</span></div></div> : null}
      <main id="main-content" tabIndex={-1}>{children}</main>
      <SiteFooter />
      <MobileNavigation />
    </div>
  );
}
