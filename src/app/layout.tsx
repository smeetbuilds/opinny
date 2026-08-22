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
  display: "block",
  preload: true,
  fallback: [],
  adjustFontFallback: false
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "block",
  preload: true,
  fallback: [],
  adjustFontFallback: false
});

export const metadata: Metadata = {
  ...(appConfig.siteUrl ? { metadataBase: new URL(appConfig.siteUrl) } : {}),
  title: {
    default: "Opinny — Trade what happens next",
    template: "%s · Opinny"
  },
  description: "A crypto prediction-market interface for exploring event probabilities, trading outcomes and managing positions.",
  openGraph: {
    type: "website",
    siteName: "Opinny",
    title: "Opinny — Trade what happens next",
    description: "A crypto prediction-market interface for exploring event probabilities, trading outcomes and managing positions."
  },
  twitter: {
    card: "summary",
    title: "Opinny — Trade what happens next",
    description: "A crypto prediction-market interface for exploring event probabilities, trading outcomes and managing positions."
  },
  icons: {
    icon: "/favicon.svg"
  }
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const marketCatalog = await dataAdapter.listMarkets();

  return (
    <html lang="en">
      <body className={`${inter.className} ${inter.variable} ${instrumentSerif.variable}`}>
        <ModalFocusManager />
        <AppProvider initialMarkets={marketCatalog}>{children}</AppProvider>
      </body>
    </html>
  );
}
