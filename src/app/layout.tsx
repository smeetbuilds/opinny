import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/components/app-provider";

export const metadata: Metadata = {
  title: {
    default: "Opinny — Trade what happens next",
    template: "%s · Opinny"
  },
  description: "A clean prediction-market interface for exploring and trading event outcomes.",
  icons: {
    icon: "/favicon.svg"
  }
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
