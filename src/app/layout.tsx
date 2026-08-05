import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/app-provider";
import { dataAdapter } from "@/lib/data";

export const metadata: Metadata = {
  title: {
    default: "Opinny — Trade what happens next",
    template: "%s · Opinny"
  },
  description: "A crypto prediction-market interface for exploring event probabilities, trading outcomes and managing positions.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const marketCatalog = await dataAdapter.listMarkets();

  return (
    <html lang="en">
      <body>
        <AppProvider initialMarkets={marketCatalog}>{children}</AppProvider>
      </body>
    </html>
  );
}
