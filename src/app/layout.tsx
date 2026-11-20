import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/app-provider";
import { ModalFocusManager } from "@/components/modal-focus-manager";
import { dataAdapter } from "@/lib/data";
import { appConfig } from "@/lib/config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  fallback: [],
  adjustFontFallback: false
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
  preload: true,
  fallback: [],
  adjustFontFallback: false
});

const siteDescription = appConfig.adapter === "mock"
  ? "Explore prediction markets, place simulated USDC trades and manage a browser-local paper portfolio. No real money, wallet transactions or live prices."
  : "Explore event-market probabilities, prepare crypto trades and manage positions through a connected wallet integration.";

export const metadata: Metadata = {
  ...(appConfig.siteUrl ? { metadataBase: new URL(appConfig.siteUrl) } : {}),
  title: {
    default: "Opinny — Trade what happens next",
    template: "%s · Opinny"
  },
  description: siteDescription,
  openGraph: {
    type: "website",
    siteName: "Opinny",
    title: "Opinny — Trade what happens next",
    description: siteDescription
  },
  twitter: {
    card: "summary",
    title: "Opinny — Trade what happens next",
    description: siteDescription
  },
  icons: {
    icon: "/favicon.svg"
  }
};

// Place both font-variable classes on <html>: the :root typography aliases
// must resolve to Next.js's scoped, self-hosted family names.
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const marketCatalog = await dataAdapter.listMarkets();

  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable}`}>
      <body className={inter.className}>
        <ModalFocusManager />
        <AppProvider initialMarkets={marketCatalog}>{children}</AppProvider>
      </body>
    </html>
  );
}
