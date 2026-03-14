"use client";
import { useState, useEffect } from "react";

export default function Landing({ onEnter }: { onEnter: () => void }) {
  const [v, setV] = useState(false);
  const [sy, setSy] = useState(0);
  useEffect(() => { setV(true); const h = () => setSy(window.scrollY); window.addEventListener("scroll", h); return () => window.removeEventListener("scroll", h); }, []);

  const F = [
    { i: "\u25C6", t: "Multi-Model AI", d: "Claude, GPT-4o and more. Switch instantly or compare side by side.", c: "#00f5d4" },
    { i: "\u26A1", t: "Real-Time Streaming", d: "Watch AI think in real-time with blazing fast responses.", c: "#fbbf24" },
    { i: "\u2726", t: "Web Search", d: "AI-powered search with verified sources. Like Perplexity, but better.", c: "#c084fc" },
    { i: "\u25CE", t: "Compare Models", d: "The feature nobody else has. Claude vs GPT-4o, side by side.", c: "#f472b6" },
    { i: "\u2261", t: "5 Powerful Modes", d: "Chat, Search, Generate, Agents, Code. One platform for everything.", c: "#60a5fa" },
    { i: "\u2194", t: "Persistent Memory", d: "Conversations saved and searchable. Pick up where you left off.", c: "#34d399" },
  ];

  const P = [
    { n: "Free", p: "$0", s: "/forever", f: ["15 messages/day", "All AI models", "Web search", "Compare mode"], cta: "Get Started", pop: false },
    { n: "Pro", p: "$20", s: "/month", f: ["Unlimited messages", "Priority speed", "Advanced agents", "API access", "File uploads"], cta: "Start Pro Trial", pop: true },
    { n: "Team", p: "$25", s: "/seat/mo", f: ["Everything in Pro", "Shared workspaces", "Admin dashboard", "SSO & RBAC", "Priority support"], cta: "Contact Sales", pop: false },
  ];

  const st = { transition: "all .8s cubic-bezier(.16,1,.3,1)", opacity: v ? 1 : 0, transform: v ? "none" : "translateY(30px)" };

  return (
    <div style={{ background: "#050508", color: "#e4e4ed", fontFamily: "Outfit, system-ui, sans-serif", minHeight: "100vh", overflowX: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />

      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: sy > 50 ? "rgba(5,5,8,.9)" : "transparent", backdropFilter: sy > 50 ? "blur(20px)" : "none", borderBottom: sy > 50 ? "1px solid rgba(255,255,255,.05)" : "none", transition: "all .3s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#00f5d4,#00b4d8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "JetBrains Mono", fontSize: 13, fontWeight: 800, color: "#050508" }}>TR</div>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.5 }}>TraceRemove<span style={{ color: "#00f5d4" }}>AI</span></span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onEnter} style={{ padding: "7px 18px", borderRadius: 7, background: "transparent", border: "1px solid rgba(255,255,255,.12)", color: "#e4e4ed", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Sign In</button>
          <button onClick={onEnter} style={{ padding: "7px 18px", borderRadius: 7, background: "linear-gradient(135deg,#00f5d4,#00b4d8)", border: "none", color: "#050508", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Get Started</button>
        </div>
      </nav>

      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "120px 20px 80px", position: "relative" }}>
        <div style={{ position: "absolute", top: "15%", left: "50%", transform: "translate(-50%,-50%)", width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,245,212,.06) 0%,transparent 60%)", pointerEvents: "none" }} />
        <div style={{ ...st, transitionDelay: "0s", marginBottom: 16 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 100, background: "rgba(0,245,212,.07)", border: "1px solid rgba(0,245,212,.12)", fontSize: 12, fontWeight: 600, color: "#00f5d4", fontFamily: "JetBrains Mono" }}>{"\u2022"} Now in public beta</span>
        </div>
        <h1 style={{ ...st, transitionDelay: ".1s", fontSize: "clamp(32px,7vw,72px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: 800, margin: "0 0 20px" }}>The AI Platform<br /><span style={{ background: "linear-gradient(135deg,#00f5d4,#00b4d8 50%,#c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>That Does Everything</span></h1>
        <p style={{ ...st, transitionDelay: ".2s", fontSize: "clamp(15px,2vw,19px)", color: "#8888a0", maxWidth: 540, lineHeight: 1.7, margin: "0 0 36px" }}>Chat with Claude & GPT-4o. Search the web. Compare models side by side. Generate content. Deploy agents. All in one beautiful interface.</p>
        <div style={{ ...st, transitionDelay: ".3s", display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={onEnter} style={{ padding: "13px 28px", borderRadius: 9, background: "linear-gradient(135deg,#00f5d4,#00b4d8)", border: "none", color: "#050508", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 6px 30px rgba(0,245,212,.2)" }}>Start Free — No Card Required</button>
        </div>
        <div style={{ ...st, transitionDelay: ".5s", display: "flex", gap: 32, marginTop: 60, flexWrap: "wrap", justifyContent: "center" }}>
          {[["4","Models"],["5","Modes"],["<1s","Latency"],["99.9%","Uptime"]].map(([v,l],i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#00f5d4", fontFamily: "JetBrains Mono" }}>{v}</div>
              <div style={{ fontSize: 11, color: "#55556a", fontWeight: 600, marginTop: 2, textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "JetBrains Mono" }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "80px 20px", position: "relative" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 100, background: "rgba(192,132,252,.08)", border: "1px solid rgba(192,132,252,.15)", fontSize: 11, fontWeight: 700, color: "#c084fc", fontFamily: "JetBrains Mono", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16 }}>Exclusive Feature</span>
          <h2 style={{ fontSize: "clamp(24px,4vw,44px)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 12px" }}>Compare Models <span style={{ color: "#c084fc" }}>Side by Side</span></h2>
          <p style={{ fontSize: 16, color: "#8888a0", maxWidth: 500, margin: "0 auto 40px", lineHeight: 1.7 }}>One prompt, two models, instant comparison. No other platform does this.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12, maxWidth: 800, margin: "0 auto" }}>
            {[{n:"Claude Sonnet",i:"\u25C6",c:"#00f5d4",t:"Quantum computing uses qubits in superposition \u2014 both 0 and 1 simultaneously, like a spinning coin..."},{n:"GPT-4o",i:"\u25CE",c:"#f472b6",t:"Quantum computing leverages quantum mechanics. Unlike classical bits, qubits represent multiple states at once..."}].map((m,i) => (
              <div key={i} style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.06)", borderRadius: 14, overflow: "hidden", textAlign: "left" }}>
                <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,.02)" }}>
                  <span style={{ fontSize: 16, color: m.c }}>{m.i}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{m.n}</span>
                </div>
                <div style={{ padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#9999aa" }}>{m.t}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "80px 20px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(24px,4vw,44px)", fontWeight: 900, letterSpacing: "-0.03em", textAlign: "center", margin: "0 0 12px" }}>Everything You Need</h2>
          <p style={{ fontSize: 16, color: "#8888a0", textAlign: "center", maxWidth: 450, margin: "0 auto 48px", lineHeight: 1.7 }}>One platform to replace ChatGPT, Claude, and Perplexity.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 12 }}>
            {F.map((f,i) => (
              <div key={i} style={{ padding: "24px 20px", borderRadius: 14, background: "rgba(255,255,255,.015)", border: "1px solid rgba(255,255,255,.04)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent," + f.c + "40,transparent)" }} />
                <div style={{ fontSize: 24, marginBottom: 12, color: f.c }}>{f.i}</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{f.t}</div>
                <div style={{ fontSize: 13, color: "#8888a0", lineHeight: 1.7 }}>{f.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "80px 20px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(24px,4vw,44px)", fontWeight: 900, letterSpacing: "-0.03em", textAlign: "center", margin: "0 0 12px" }}>Simple Pricing</h2>
          <p style={{ fontSize: 16, color: "#8888a0", textAlign: "center", margin: "0 0 48px" }}>Start free. Upgrade when you need more.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 12 }}>
            {P.map((p,i) => (
              <div key={i} style={{ padding: "28px 24px", borderRadius: 14, background: p.pop ? "rgba(0,245,212,.03)" : "rgba(255,255,255,.015)", border: "1px solid " + (p.pop ? "rgba(0,245,212,.2)" : "rgba(255,255,255,.04)"), position: "relative", overflow: "hidden" }}>
                {p.pop && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,#00f5d4,#00b4d8)" }} />}
                {p.pop && <span style={{ position: "absolute", top: 12, right: 12, padding: "2px 8px", borderRadius: 100, background: "rgba(0,245,212,.1)", fontSize: 10, fontWeight: 700, color: "#00f5d4", fontFamily: "JetBrains Mono" }}>POPULAR</span>}
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: p.pop ? "#00f5d4" : "#e4e4ed" }}>{p.n}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 20 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, letterSpacing: -1 }}>{p.p}</span>
                  <span style={{ fontSize: 13, color: "#55556a" }}>{p.s}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                  {p.f.map((f,j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#9999aa" }}>
                      <span style={{ color: "#00f5d4", fontSize: 12 }}>{"\u2713"}</span>{f}
                    </div>
                  ))}
                </div>
                <button onClick={onEnter} style={{ width: "100%", padding: "10px", borderRadius: 8, background: p.pop ? "linear-gradient(135deg,#00f5d4,#00b4d8)" : "rgba(255,255,255,.04)", border: p.pop ? "none" : "1px solid rgba(255,255,255,.08)", color: p.pop ? "#050508" : "#e4e4ed", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{p.cta}</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "80px 20px", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(24px,4vw,44px)", fontWeight: 900, letterSpacing: "-0.03em", margin: "0 0 12px" }}>Ready to Try the <span style={{ background: "linear-gradient(135deg,#00f5d4,#c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Future of AI?</span></h2>
        <p style={{ fontSize: 16, color: "#8888a0", maxWidth: 450, margin: "0 auto 28px", lineHeight: 1.7 }}>Join users who switched from ChatGPT and Claude. No credit card required.</p>
        <button onClick={onEnter} style={{ padding: "14px 36px", borderRadius: 10, background: "linear-gradient(135deg,#00f5d4,#00b4d8)", border: "none", color: "#050508", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 6px 30px rgba(0,245,212,.2)" }}>Get Started Free</button>
      </section>

      <footer style={{ padding: "32px 20px", borderTop: "1px solid rgba(255,255,255,.05)", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg,#00f5d4,#00b4d8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 800, color: "#050508" }}>TR</div>
          <span style={{ fontSize: 13, fontWeight: 700 }}>TraceRemove AI</span>
        </div>
        <p style={{ fontSize: 12, color: "#55556a" }}>{"\u00A9"} 2026 TraceRemove AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
