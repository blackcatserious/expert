import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

import "./globals.css";
export const metadata: Metadata = { title: "TraceRemove AI", description: "The complete AI platform" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider >
      <html lang="en">
        <head><link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" /></head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
