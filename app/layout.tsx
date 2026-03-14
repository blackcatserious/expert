import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "TraceRemove AI — The Complete AI Platform",
  description: "Chat with Claude & GPT-4o, search the web with AI, compare models side by side, generate content, and deploy autonomous agents. All in one beautiful interface.",
  keywords: ["AI", "ChatGPT alternative", "Claude", "GPT-4o", "AI chat", "AI search", "model comparison", "AI platform"],
  authors: [{ name: "TraceRemove AI" }],
  openGraph: {
    title: "TraceRemove AI — The AI Platform That Does Everything",
    description: "Multi-model AI chat with Claude & GPT-4o. Web search, side-by-side comparison, code generation, and autonomous agents.",
    url: "https://traceremove.expert",
    siteName: "TraceRemove AI",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "TraceRemove AI — The AI Platform That Does Everything",
    description: "Chat with Claude & GPT-4o. Compare models side by side. Search the web with AI. All in one place.",
  },
  robots: { index: true, follow: true },
  metadataBase: new URL("https://traceremove.expert"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
          <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%2300f5d4'/><text x='50' y='68' font-size='50' font-weight='900' text-anchor='middle' font-family='monospace' fill='%23060609'>TR</text></svg>" />
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
