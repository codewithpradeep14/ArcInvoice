import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ArcInvoice — Stablecoin Invoicing on Circle Arc",
  description:
    "Accept USDC payments directly on Circle's Arc blockchain with automated on-chain verification, instant settlements, and shareable payment links.",
  keywords: [
    "Arc",
    "Circle Arc",
    "USDC",
    "Web3 Invoicing",
    "Crypto Invoicing",
    "Stablecoin Payments",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full flex flex-col font-sans text-slate-900 bg-slate-50 antialiased selection:bg-blue-100 selection:text-blue-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
