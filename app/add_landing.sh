#!/bin/bash
cd /workspaces/expert

echo "=== Creating TraceRemove AI Landing Page ==="

# 1. Create landing page
cat > app/landing.tsx << 'ENDOFFILE'
"use client";
import { useEffect, useState } from "react";

const FEATURES = [
  { icon: "\u25C6", title: "Multi-Model AI", desc: "Claude Sonnet, GPT-4o, and more — switch models instantly or compare them side by side.", color: "#00f5d4" },
  { icon: "\u26A1", title: "Real-Time Streaming", desc: "Watch AI think in real-time with blazing fast streaming responses and markdown rendering.", color: "#fbbf24" },
  { icon: "\u2726", title: "Web Search", desc: "Search the web with AI — get comprehensive answers with verified sources, like Perplexity but better.", color: "#c084fc" },
  { icon: "\u25CE", title: "Side-by-Side Compare", desc: "The feature no one else has — compare Claude vs GPT-4o on the same prompt simultaneously.", color: "#f472b6" },
  { icon: "\u2261", title: "5 Powerful Modes", desc: "Chat, Search, Generate, Agents, Code — one platform for everything.", color: "#60a5fa" },
  { icon: "\u2194", title: "Persistent Memory", desc: "Your conversations are saved and searchable. Pick up right where you left off.", color: "#34d399" },
];

const PRICING = [
  { name: "Free", price: "$0", period: "/forever", features: ["15 messages/day", "All AI models", "Web search", "Compare mode", "Chat history"], cta: "Get Started", popular: false },
  { name: "Pro", price: "$20", period: "/month", features: ["Unlimited messages", "All AI models", "Priority speed", "Advanced agents", "API access", "File uploads"], cta: "Start Pro Trial", popular: true },
  { name: "Team", price: "$25", period: "/seat/mo", features: ["Everything in Pro", "Shared workspaces", "Team prompt library", "Admin dashboard", "SSO & RBAC", "Priority support"], cta: "Contact Sales", popular: false },
];

const STATS = [
  { value: "4", label: "AI Models" },
  { value: "5", label: "Modes" },
  { value: "<1s", label: "First Token" },
  { value: "99.9%", label: "Uptime" },
];

export default function Landing({ onEnter }: { onEnter: () => void }) {
  const [scrollY, setScrollY] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div style={{ background: "#050508", color: "#e4e4ed", fontFamily: "'Outfit', system-ui, sans-serif", minHeight: "100vh", overflow: "auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      {/* NAVBAR */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: scrollY > 50 ? "rgba(5,5,8,.85)" : "transparent", backdropFilter: scrollY > 50 ? "blur(20px)" : "none", borderBottom: scrollY > 50 ? "1px solid rgba(255,255,255,.05)" : "none", transition: "all .3s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: "linear-gradient(135deg,#00f5d4,#00b4d8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono'", fontSize: 14, fontWeight: 800, color: "#050508" }}>TR</div>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>TraceRemove<span style={{ color: "#00f5d4" }}>AI</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onEnter} style={{ padding: "8px 20px", borderRadius: 8, background: "transparent", border: "1px solid rgba(255,255,255,.1)", color: "#e4e4ed", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Sign In</button>
          <button onClick={onEnter} style={{ padding: "8px 20px", borderRadius: 8, background: "linear-gradient(135deg,#00f5d4,#00b4d8)", border: "none", color: "#050508", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Get Started Free</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 24px 80px", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translate(-50%,-50%)", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,245,212,.06) 0%,transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "60%", right: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(192,132,252,.04) 0%,transparent 60%)", pointerEvents: "none" }} />

        <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)", transition: "all .8s cubic-bezier(.16,1,.3,1)", marginBottom: 20 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, background: "rgba(0,245,212,.06)", border: "1px solid rgba(0,245,212,.12)", fontSize: 13, fontWeight: 600, color: "#00f5d4", fontFamily: "'JetBrains Mono'", marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00f5d4", animation: "pulse 2s infinite" }} /> Now in public beta
          </div>
        </div>

        <h1 style={{ fontSize: "clamp(36px, 7vw, 80px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: 900, margin: "0 0 24px", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)", transition: "all .8s .1s cubic-bezier(.16,1,.3,1)" }}>
          The AI Platform<br />
          <span style={{ background: "linear-gradient(135deg,#00f5d4 0%,#00b4d8 50%,#c084fc 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>That Does Everything</span>
        </h1>

        <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "#8888a0", maxWidth: 600, lineHeight: 1.7, margin: "0 0 40px", fontWeight: 400, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)", transition: "all .8s .2s cubic-bezier(.16,1,.3,1)" }}>
          Chat with Claude & GPT-4o. Search the web with AI. Compare models side by side. Generate content. Deploy autonomous agents. All in one beautiful interface.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)", transition: "all .8s .3s cubic-bezier(.16,1,.3,1)" }}>
          <button onClick={onEnter} style={{ padding: "14px 32px", borderRadius: 10, background: "linear-gradient(135deg,#00f5d4,#00b4d8)", border: "none", color: "#050508", fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 40px rgba(0,245,212,.2)" }}>Start Free — No Card Required</button>
          <button style={{ padding: "14px 32px", borderRadius: 10, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", color: "#e4e4ed", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Watch Demo</button>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 40, marginTop: 80, opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "all .8s .5s cubic-bezier(.16,1,.3,1)", flexWrap: "wrap", justifyContent: "center" }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#00f5d4", fontFamily: "'JetBrains Mono'", letterSpacing: -1 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: "#55556a", fontWeight: 500, marginTop: 4, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "'JetBrains Mono'" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* UNIQUE FEATURE - COMPARE */}
      <section style={{ padding: "100px 24px", position: "relative" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", padding: "4px 14px", borderRadius: 100, background: "rgba(192,132,252,.08)", border: "1px solid rgba(192,132,252,.15)", fontSize: 12, fontWeight: 700, color: "#c084fc", fontFamily: "'JetBrains Mono'", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 20 }}>Exclusive Feature</div>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 16 }}>Compare AI Models<br /><span style={{ color: "#c084fc" }}>Side by Side</span></h2>
          <p style={{ fontSize: 18, color: "#8888a0", maxWidth: 600, margin: "0 auto 50px", lineHeight: 1.7 }}>The feature no other AI platform has. Send one prompt, get two answers. See which model thinks better for your task.</p>

          {/* Mock comparison */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 900, margin: "0 auto" }}>
            {[{ name: "Claude Sonnet", icon: "\u25C6", color: "#00f5d4", text: "Quantum computing uses qubits that exist in superposition — both 0 and 1 simultaneously, like a spinning coin..." }, { name: "GPT-4o", icon: "\u25CE", color: "#f472b6", text: "Quantum computing leverages quantum mechanics principles. Unlike classical bits, qubits can represent multiple states at once..." }].map((m, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 16, overflow: "hidden", textAlign: "left" }}>
                <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.02)" }}>
                  <span style={{ fontSize: 18, color: m.color }}>{m.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{m.name}</span>
                </div>
                <div style={{ padding: "18px 20px", fontSize: 14, lineHeight: 1.75, color: "#b0b0c0" }}>{m.text}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: "80px 24px", position: "relative" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <h2 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 16 }}>Everything You Need.<br /><span style={{ color: "#00f5d4" }}>Nothing You Don't.</span></h2>
            <p style={{ fontSize: 18, color: "#8888a0", maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>One platform to replace ChatGPT, Claude, and Perplexity. For real.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ padding: "28px 24px", borderRadius: 16, background: "rgba(255,255,255,.015)", border: "1px solid rgba(255,255,255,.04)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${f.color}40, transparent)` }} />
                <div style={{ fontSize: 28, marginBottom: 14, color: f.color }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, letterSpacing: -0.3 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "#8888a0", lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: "80px 24px", position: "relative" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <h2 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 16 }}>Simple, Honest Pricing</h2>
            <p style={{ fontSize: 18, color: "#8888a0" }}>Start free. Upgrade when you need more.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {PRICING.map((p, i) => (
              <div key={i} style={{ padding: "32px 28px", borderRadius: 16, background: p.popular ? "rgba(0,245,212,.03)" : "rgba(255,255,255,.015)", border: "1px solid " + (p.popular ? "rgba(0,245,212,.2)" : "rgba(255,255,255,.04)"), position: "relative", overflow: "hidden" }}>
                {p.popular && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#00f5d4,#00b4d8)" }} />}
                {p.popular && <div style={{ position: "absolute", top: 14, right: 14, padding: "3px 10px", borderRadius: 100, background: "rgba(0,245,212,.1)", fontSize: 11, fontWeight: 700, color: "#00f5d4", fontFamily: "'JetBrains Mono'" }}>POPULAR</div>}
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: p.popular ? "#00f5d4" : "#e4e4ed" }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 24 }}>
                  <span style={{ fontSize: 42, fontWeight: 900, letterSpacing: -2 }}>{p.price}</span>
                  <span style={{ fontSize: 14, color: "#55556a" }}>{p.period}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                  {p.features.map((f, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#b0b0c0" }}>
                      <span style={{ color: "#00f5d4", fontSize: 13 }}>{"\u2713"}</span> {f}
                    </div>
                  ))}
                </div>
                <button onClick={onEnter} style={{ width: "100%", padding: "12px", borderRadius: 10, background: p.popular ? "linear-gradient(135deg,#00f5d4,#00b4d8)" : "rgba(255,255,255,.04)", border: p.popular ? "none" : "1px solid rgba(255,255,255,.08)", color: p.popular ? "#050508" : "#e4e4ed", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{p.cta}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "100px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 16 }}>Ready to Try the<br /><span style={{ background: "linear-gradient(135deg,#00f5d4,#c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Future of AI?</span></h2>
        <p style={{ fontSize: 18, color: "#8888a0", maxWidth: 500, margin: "0 auto 32px", lineHeight: 1.7 }}>Join thousands of users who switched from ChatGPT and Claude. No credit card required.</p>
        <button onClick={onEnter} style={{ padding: "16px 40px", borderRadius: 12, background: "linear-gradient(135deg,#00f5d4,#00b4d8)", border: "none", color: "#050508", fontSize: 18, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 8px 40px rgba(0,245,212,.25)" }}>Get Started Free</button>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "40px 24px", borderTop: "1px solid rgba(255,255,255,.05)", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#00f5d4,#00b4d8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono'", fontSize: 11, fontWeight: 800, color: "#050508" }}>TR</div>
          <span style={{ fontSize: 15, fontWeight: 700 }}>TraceRemove AI</span>
        </div>
        <p style={{ fontSize: 13, color: "#55556a" }}>&copy; 2026 TraceRemove AI. All rights reserved.</p>
      </footer>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { overflow-x: hidden; }
      `}</style>
    </div>
  );
}
ENDOFFILE

echo "Landing component created!"

# 2. Update page.tsx to show landing for unauthenticated users
# We need to wrap the existing page content
node -e "
const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

// Add import for Landing and SignedIn/SignedOut
if (!code.includes('import Landing')) {
  code = code.replace(
    'import { useUser, UserButton } from \"@clerk/nextjs\";',
    'import { useUser, UserButton, SignedIn, SignedOut, useClerk } from \"@clerk/nextjs\";\nimport Landing from \"./landing\";'
  );
}

// Wrap the main return with SignedIn/SignedOut
if (!code.includes('SignedIn')) {
  code = code.replace(
    'const currentMode = MODES.find(m => m.id === mode) || MODES[0];',
    'const currentMode = MODES.find(m => m.id === mode) || MODES[0];\n  const { openSignIn } = useClerk();'
  );
  
  // Find the return statement and wrap it
  code = code.replace(
    'return (\n    <div style={{ width: \"100%\", height: \"100vh\",',
    'return (\n    <>\n    <SignedOut><Landing onEnter={() => openSignIn()} /></SignedOut>\n    <SignedIn>\n    <div style={{ width: \"100%\", height: \"100vh\",'
  );
  
  // Close the SignedIn and fragment at the end
  // Find the last closing div and parenthesis
  const lastReturn = code.lastIndexOf('  );');
  code = code.substring(0, lastReturn) + '    </SignedIn>\n    </>\n  );' + code.substring(lastReturn + 4);
}

fs.writeFileSync('app/page.tsx', code);
console.log('page.tsx updated with Landing gate! Lines:', code.split('\\n').length);
"

echo "=== Done! Committing... ==="
git add -A && git commit -m "feat: landing page + auth gate" && git push origin main
