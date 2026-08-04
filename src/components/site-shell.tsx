import { Header } from "./header";
import { MobileNavigation } from "./mobile-navigation";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-shell">
      <Header />
      <main>{children}</main>
      <MobileNavigation />
    </div>
  );
}
