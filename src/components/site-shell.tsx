import { Header } from "./header";
import { MobileNavigation } from "./mobile-navigation";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Header />
      <main id="main-content" tabIndex={-1}>{children}</main>
      <MobileNavigation />
    </div>
  );
}
