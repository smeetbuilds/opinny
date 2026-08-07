import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/components/app-provider";
import { dataAdapter } from "@/lib/data";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
  preload: true
});

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
      <body className={`${inter.variable} ${instrumentSerif.variable}`}>
        <AppProvider initialMarkets={marketCatalog}>{children}</AppProvider>
      </body>
    </html>
  );
}
