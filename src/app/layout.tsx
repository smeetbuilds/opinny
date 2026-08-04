import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/components/app-provider";

export const metadata: Metadata = {
  applicationName: "Opinny",
  title: {
    default: "Opinny — Trade what happens next",
    template: "%s · Opinny"
  },
  description: "A clean, crypto-only prediction-market platform interface for exploring and trading event outcomes.",
  keywords: ["prediction markets", "event markets", "crypto trading", "probability markets"],
  category: "finance",
  icons: {
    icon: "/favicon.svg"
  },
  robots: {
    index: true,
    follow: true
  }
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f7f6f1",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
