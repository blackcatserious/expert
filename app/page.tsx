"use client";
import { useState, useEffect, useRef, useCallback } from "react";
const MODELS = [
  { id: "tr-ultra", name: "TR Ultra", desc: "Maximum precision", icon: "\u25C6", color: "#00f5d4" },
  { id: "tr-fast", name: "TR Fast", desc: "Speed optimized", icon: "\u26A1", color: "#fbbf24" },
  { id: "tr-creative", name: "TR Creative", desc: "Creative generation", icon: "\u2726", color: "#c084fc" },
  { id: "tr-agent", name: "TR Agent", desc: "Autonomous agents", icon: "\u25CE", color: "#f472b6" },
];
const MODES = [
  { id: "chat", label: "Chat", tag: "CH", desc: "AI conversation" },
  { id: "search", label: "Search", tag: "SE", desc: "Web search with sources" },
  { id: "generate", label: "Generate", tag: "GE", desc: "Content & images" },
  { id: "agents", label: "Agents", tag: "AG", desc: "Autonomous tasks" },
  { id: "code", label: "Code", tag: "CD", desc: "Write & analyze code" },
];
const AGENTS = [
  { id: "researcher", name: "Researcher", tag: "RSC", desc: "Deep topic analysis" },
  { id: "writer", name: "Writer", tag: "WRT", desc: "Long-form content" },
  { id: "analyst", name: "Analyst", tag: "ANL", desc: "Data analysis" },
  { id: "designer", name: "Designer", tag: "DSN", desc: "Visual content" },
  { id: "developer", name: "Developer", tag: "DEV", desc: "Code generation" },
  { id: "translator", name: "Translator", tag: "TRL", desc: "Multi-language" },
];
const SOURCES = [
  { title: "TechCrunch - The Rise of AI Agents in 2026", domain: "techcrunch.com", score: 97 },
  { title: "ArXiv - Scaling Laws for Neural Models", domain: "arxiv.org", score: 93 },
  { title: "MIT Tech Review - Autonomous AI Systems", domain: "technologyreview.com", score: 89 },
  { title: "The Verge - Latest AI Breakthroughs", domain: "theverge.com", score: 84 },
];
const HISTORY = [
  { id: 1, title: "AI market analysis 2026", mode: "search", time: "12m ago" },
  { id: 2, title: "Logo generation variants", mode: "generate", time: "1h ago" },
  { id: 3, title: "REST API refactoring", mode: "code", time: "3h ago" },
  { id: 4, title: "Competitor deep research", mode: "agents", time: "Yesterday" },
  { id: 5, title: "Product launch copy", mode: "chat", time: "Yesterday" },
];
const QUICK = [
  { text: "Analyze my competitors", sub: "Deep market research" },
  { text: "Write production code", sub: "API, frontend, backend" },
  { text: "Generate visual content", sub: "Images, diagrams, mockups" },
  { text: "Research any topic", sub: "With verified sources" },
];
interface Msg { role: string; content: string; sources?: boolean; }
function useTypewriter(text: string, speed: number, active: boolean) {
  const [out, setOut] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!active) { setOut(text); setDone(true); return; }
    setOut(""); setDone(false);
    let i = 0;
    const t = setInterval(() => { i++; setOut(text.slice(0, i)); if (i >= text.length) { clearInterval(t); setDone(true); } }, speed);
    return () => clearInterval(t);
  }, [text, speed, active]);
  return { out, done };
}
function Spinner() {
  const [f, setF] = useState(0);
  const ch = ["\u280B","\u2819","\u2839","\u2838","\u283C","\u2834","\u2826","\u2827","\u2807","\u280F"];
  useEffect(() => { const t = setInterval(() => setF(x => (x + 1) % ch.length), 80); return () => clearInterval(t); }, []);
  return <span style={{ color: "var(--cyan)", fontFamily: "var(--mono)" }}>{ch[f]} Thinking</span>;
}
function MsgBubble({ msg, isLast }: { msg: Msg; isLast: boolean }) {
  const isUser = msg.role === "user";
  const { out: text, done } = useTypewriter(msg.content, 10, !isUser && isLast);
  return (
    <div style={{ display: "flex", gap: 14, justifyContent: isUser ? "flex-end" : "flex-start", animation: "slideUp .3s ease both", marginBottom: 6 }}>
      {!isUser && <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: "linear-gradient(135deg,#00f5d4,#00b4d8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontSize: 13, fontWeight: 800, color: "#060609", marginTop: 4 }}>TR</div>}
      <div style={{ maxWidth: "72%", padding: "14px 18px", background: isUser ? "rgba(0,245,212,.07)" : "rgba(255,255,255,.025)", border: "1px solid " + (isUser ? "rgba(0,245,212,.15)" : "rgba(255,255,255,.04)"), borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px", fontSize: 14, lineHeight: 1.75, whiteSpace: "pre-wrap", color: "#e4e4ed" }}>
        {text}
        {!isUser && !done && <span style={{ color: "#00f5d4", animation: "blink 1s infinite" }}>{"\u258D"}</span>}
        {msg.sources && done && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#00f5d4", textTransform: "uppercase", letterSpacing: 1.5, fontFamily: "var(--mono)" }}>Sources</div>
            {SOURCES.map((s, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,.02)", border: "1px solid rgba(255,255,255,.05)", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(0,245,212," + (.25 - i * .04) + ")", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#00f5d4", fontFamily: "var(--mono)", flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: "#55556a", fontFamily: "var(--mono)" }}>{s.domain}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#00f5d4", fontFamily: "var(--mono)", background: "rgba(0,245,212,.08)", padding: "3px 9px", borderRadius: 20, flexShrink: 0 }}>{s.score}%</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default function Home() {
  const [sidebar, setSidebar] = useState(true);
  const [mode, setMode] = useState("chat");
  const [model, setModel] = useState(MODELS[0]);
  const [modelDrop, setModelDrop] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState(["researcher"]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [genType, setGenType] = useState("text");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  const send = useCallback(() => {
    if (!input.trim() || loading) return;
    const q = input.trim();
    setMessages(p => [...p, { role: "user", content: q }]);
    setInput(""); setLoading(true);
    setTimeout(() => {
      const r: Record<string, Msg> = {
        chat: { role: "ai", content: "Great question about \"" + q + "\".\n\nBased on my analysis, here are the key insights:\n\nTraceRemove AI processes your query through multiple reasoning layers, cross-referencing real-time data with our knowledge graph. The " + model.name + " model excels at this type of analysis.\n\nI can elaborate on any specific aspect." },
        search: { role: "ai", content: "Here are the most relevant results for \"" + q + "\":", sources: true },
        generate: { role: "ai", content: "Generated " + genType + " content for \"" + q + "\":\n\n---\n\nContent produced using " + model.name + " with maximum quality.\n\n---\n\nComplete. I can refine or generate alternatives." },
        agents: { role: "ai", content: "Task dispatched: \"" + q + "\"\n\n" + agents.map(function(a) { var ag = AGENTS.find(function(x) { return x.id === a; }); return ag ? "[" + ag.tag + "] " + ag.name + " processing" : ""; }).join("\n") + "\n\nAgents working autonomously..." },
        code: { role: "ai", content: "```typescript\n// " + q + "\nimport { TraceRemoveClient } from '@traceremove/sdk';\nconst client = new TraceRemoveClient({ model: '" + model.id + "' });\nexport async function execute(query: string) {\n  const result = await client.process({ input: query, streaming: true });\n  return result;\n}\n```\n\nReady to use." },
      };
      setMessages(p => [...p, r[mode] || r.chat]); setLoading(false);
    }, 1200 + Math.random() * 800);
  }, [input, loading, mode, model, agents, genType]);
  const currentMode = MODES.find(function(m) { return m.id === mode; }) || MODES[0];
  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", background: "var(--bg)", color: "var(--fg)", fontFamily: "var(--sans)", overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", top: -300, right: -200, width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,245,212,.015) 0%,transparent 65%)", pointerEvents: "none" }} />
      <div style={{ width: sidebar ? 272 : 0, height: "100vh", background: "var(--sidebar)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", transition: "width .25s cubic-bezier(.4,0,.2,1)", overflow: "hidden", flexShrink: 0, zIndex: 10 }}>
        <div style={{ minWidth: 272, height: "100%", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "18px 18px 14px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--border)" }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "linear-gradient(135deg,#00f5d4,#00b4d8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontSize: 14, fontWeight: 800, color: "#060609", boxShadow: "0 4px 24px rgba(0,245,212,.25)" }}>TR</div>
            <div><div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>TraceRemove</div><div style={{ fontSize: 11, color: "var(--dim)", fontFamily: "var(--mono)", fontWeight: 500 }}>AI Platform</div></div>
            <div style={{ marginLeft: "auto", fontSize: 10, color: "var(--dim)", background: "rgba(0,245,212,.08)", padding: "2px 8px", borderRadius: 20, fontFamily: "var(--mono)", fontWeight: 600 }}>v2.0</div>
          </div>
          <div style={{ padding: "14px 14px 6px" }}>
            <button onClick={function() { setMessages([]); }} style={{ width: "100%", padding: "10px 14px", background: "linear-gradient(135deg,rgba(0,245,212,.1),rgba(0,180,216,.05))", border: "1px solid rgba(0,245,212,.15)", borderRadius: 9, color: "#00f5d4", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit" }}>
              <span style={{ fontSize: 16, fontWeight: 300 }}>+</span> New conversation
            </button>
          </div>
          <div style={{ padding: "10px 14px 4px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--dim)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6, paddingLeft: 4, fontFamily: "var(--mono)" }}>Mode</div>
            {MODES.map(function(m) { return (
              <div key={m.id} onClick={function() { setMode(m.id); setMessages([]); }} style={{ padding: "8px 10px", borderRadius: 8, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 1, background: mode === m.id ? "rgba(0,245,212,.06)" : "transparent", borderLeft: mode === m.id ? "2px solid #00f5d4" : "2px solid transparent", transition: "all .15s" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: mode === m.id ? "#060609" : "var(--dim)", background: mode === m.id ? "#00f5d4" : "rgba(255,255,255,.05)", padding: "2px 6px", borderRadius: 4, textTransform: "uppercase", transition: "all .15s" }}>{m.tag}</div>
                <span style={{ fontSize: 13, fontWeight: mode === m.id ? 600 : 500, color: mode === m.id ? "#00f5d4" : "var(--fg)", transition: "color .15s" }}>{m.label}</span>
              </div>
            ); })}
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "8px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--dim)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6, paddingLeft: 4, fontFamily: "var(--mono)" }}>Recent</div>
            {HISTORY.map(function(h) { const modeObj = MODES.find(function(m) { return m.id === h.mode; }); return (
              <div key={h.id} style={{ padding: "7px 10px", borderRadius: 7, cursor: "pointer", marginBottom: 1, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 600, color: "var(--dim)", background: "rgba(255,255,255,.04)", padding: "1px 5px", borderRadius: 3, textTransform: "uppercase" }}>{modeObj ? modeObj.tag : ""}</div>
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 500, color: "var(--dim2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.title}</div></div>
                <div style={{ fontSize: 10, color: "var(--dim)", fontFamily: "var(--mono)", flexShrink: 0 }}>{h.time}</div>
              </div>
            ); })}
          </div>
          <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--dim)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6, paddingLeft: 4, fontFamily: "var(--mono)" }}>Ecosystem</div>
            {[{ label: "API Console", tag: "API" }, { label: "Mobile App", tag: "APP" }, { label: "Documentation", tag: "DOC" }, { label: "Marketplace", tag: "MKT" }].map(function(item, i) { return (
              <div key={i} style={{ padding: "6px 10px", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, marginBottom: 1 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 600, color: "var(--dim)", background: "rgba(255,255,255,.03)", padding: "1px 5px", borderRadius: 3 }}>{item.tag}</div>
                <span style={{ fontSize: 12, color: "var(--dim)" }}>{item.label}</span>
                <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--dim)", opacity: 0.5 }}>{"\u2197"}</span>
              </div>
            ); })}
          </div>
          <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "var(--mono)" }}>U</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600 }}>Pro Plan</div><div style={{ fontSize: 10, color: "var(--dim)", fontFamily: "var(--mono)" }}>user@traceremove.expert</div></div>
            <div onClick={function() { setSettingsOpen(!settingsOpen); }} style={{ cursor: "pointer", color: "var(--dim)", fontSize: 14, padding: 4, borderRadius: 6 }}>{"\u2699"}</div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ height: 52, padding: "0 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 14, background: "var(--bg2)", flexShrink: 0 }}>
          <button onClick={function() { setSidebar(!sidebar); }} style={{ background: "none", border: "none", color: "var(--dim)", fontSize: 18, cursor: "pointer", padding: "4px 6px", borderRadius: 5 }}>{"\u2630"}</button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, color: "#060609", background: "#00f5d4", padding: "2px 7px", borderRadius: 4, letterSpacing: 0.5, textTransform: "uppercase" }}>{currentMode.tag}</div>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{currentMode.label}</span>
            <span style={{ fontSize: 11, color: "var(--dim)", fontWeight: 500 }}>{currentMode.desc}</span>
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={function() { setModelDrop(!modelDrop); }} style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--border)", borderRadius: 8, padding: "5px 12px", color: "var(--fg)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontFamily: "inherit" }}>
              <span style={{ color: model.color, fontSize: 14 }}>{model.icon}</span>{model.name}<span style={{ color: "var(--dim)", fontSize: 8 }}>{"\u25BC"}</span>
            </button>
            {modelDrop && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 11, padding: 5, minWidth: 210, boxShadow: "0 20px 60px rgba(0,0,0,.5)", zIndex: 100, animation: "slideUp .15s ease" }}>
                {MODELS.map(function(m) { return (
                  <div key={m.id} onClick={function() { setModel(m); setModelDrop(false); }} style={{ padding: "9px 12px", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, background: model.id === m.id ? "rgba(0,245,212,.05)" : "transparent" }}>
                    <span style={{ fontSize: 16, color: m.color }}>{m.icon}</span>
                    <div><div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div><div style={{ fontSize: 11, color: "var(--dim)" }}>{m.desc}</div></div>
                    {model.id === m.id && <span style={{ marginLeft: "auto", color: "#00f5d4", fontSize: 13, fontFamily: "var(--mono)" }}>{"\u2713"}</span>}
                  </div>
                ); })}
              </div>
            )}
          </div>
          <div style={{ width: 1, height: 20, background: "var(--border)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px rgba(34,197,94,.4)" }} />
            <span style={{ fontSize: 11, color: "var(--dim)", fontFamily: "var(--mono)" }}>Online</span>
          </div>
        </div>
        {mode === "agents" && (
          <div style={{ padding: "14px 22px", borderBottom: "1px solid var(--border)", background: "var(--bg2)", animation: "slideUp .25s ease" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--dim)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, fontFamily: "var(--mono)" }}>Select agents</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 8 }}>
              {AGENTS.map(function(a) { const on = agents.includes(a.id); return (
                <div key={a.id} onClick={function() { setAgents(function(p) { return p.includes(a.id) ? p.filter(function(x) { return x !== a.id; }) : p.concat([a.id]); }); }} style={{ background: on ? "rgba(0,245,212,.06)" : "rgba(255,255,255,.015)", border: "1px solid " + (on ? "rgba(0,245,212,.25)" : "rgba(255,255,255,.05)"), borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "all .2s", position: "relative", overflow: "hidden" }}>
                  {on && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#00f5d4,transparent)" }} />}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, color: on ? "#060609" : "var(--dim)", background: on ? "#00f5d4" : "rgba(255,255,255,.06)", padding: "2px 7px", borderRadius: 4, letterSpacing: 0.5, transition: "all .2s" }}>{a.tag}</div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: on ? "var(--fg)" : "var(--dim2)" }}>{a.name}</span>
                    <div style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: on ? "#00f5d4" : "#333", boxShadow: on ? "0 0 10px #00f5d4" : "none", transition: "all .3s" }} />
                  </div>
                  <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.45 }}>{a.desc}</div>
                </div>
              ); })}
            </div>
          </div>
        )}
        {mode === "generate" && (
          <div style={{ padding: "10px 22px", borderBottom: "1px solid var(--border)", background: "var(--bg2)", display: "flex", gap: 6, animation: "slideUp .25s ease" }}>
            {["text", "image", "audio", "video"].map(function(t) { return (
              <button key={t} onClick={function() { setGenType(t); }} style={{ padding: "6px 14px", borderRadius: 20, background: genType === t ? "rgba(0,245,212,.1)" : "transparent", border: "1px solid " + (genType === t ? "rgba(0,245,212,.25)" : "var(--border)"), color: genType === t ? "#00f5d4" : "var(--dim)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>{t}</button>
            ); })}
          </div>
        )}
        <div style={{ flex: 1, overflow: "auto", padding: "24px 20px" }}>
          {messages.length === 0 ? (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "fadeIn .5s ease" }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "linear-gradient(135deg,#00f5d4,#00b4d8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontSize: 22, fontWeight: 800, color: "#060609", marginBottom: 24, boxShadow: "0 8px 40px rgba(0,245,212,.15)", animation: "glowPulse 4s ease infinite" }}>TR</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, letterSpacing: -1 }}>What can I help with?</div>
              <div style={{ fontSize: 14, color: "var(--dim)", marginBottom: 36, textAlign: "center", maxWidth: 420, lineHeight: 1.6 }}>Chat, search, generate, code, or deploy autonomous agents.</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 520, width: "100%" }}>
                {QUICK.map(function(q, i) { return (
                  <button key={i} onClick={function() { setInput(q.text); }} style={{ padding: "14px 16px", borderRadius: 11, background: "rgba(255,255,255,.02)", border: "1px solid var(--border)", color: "var(--fg)", textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{q.text}</div>
                    <div style={{ fontSize: 11, color: "var(--dim)" }}>{q.sub}</div>
                  </button>
                ); })}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 780, margin: "0 auto" }}>
              {messages.map(function(msg, i) { return <MsgBubble key={i} msg={msg} isLast={i === messages.length - 1} />; })}
              {loading && (
                <div style={{ display: "flex", gap: 14, animation: "slideUp .3s ease", marginBottom: 6 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: "linear-gradient(135deg,#00f5d4,#00b4d8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontSize: 13, fontWeight: 800, color: "#060609" }}>TR</div>
                  <div style={{ padding: "14px 18px", background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.04)", borderRadius: "16px 16px 16px 4px" }}><Spinner /></div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>
        <div style={{ padding: "14px 20px 18px", borderTop: "1px solid var(--border)", background: "var(--bg2)" }}>
          <div style={{ maxWidth: 780, margin: "0 auto", background: "rgba(255,255,255,.02)", border: "1px solid var(--border)", borderRadius: 14, padding: "4px 4px 4px 14px", display: "flex", alignItems: "flex-end", gap: 6 }} onClick={function() { if (inputRef.current) inputRef.current.focus(); }}>
            <button style={{ background: "none", border: "none", color: "var(--dim)", fontSize: 16, cursor: "pointer", padding: "8px 2px" }}>+</button>
            <textarea ref={inputRef} value={input} onChange={function(e) { setInput(e.target.value); }} onKeyDown={function(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={mode === "search" ? "Search anything..." : mode === "generate" ? "Describe what to generate..." : mode === "agents" ? "Describe the task..." : mode === "code" ? "Describe the code..." : "Message TraceRemove..."} rows={1} style={{ flex: 1, background: "none", border: "none", color: "var(--fg)", fontSize: 14, resize: "none", padding: "9px 0", lineHeight: 1.5, maxHeight: 120, outline: "none", fontFamily: "inherit" }} />
            <button style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: input.trim() ? "linear-gradient(135deg,#00f5d4,#00b4d8)" : "rgba(255,255,255,.04)", border: "none", cursor: input.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: input.trim() ? "#060609" : "var(--dim)", fontWeight: 700, transition: "all .2s" }} onClick={send}>{"\u2191"}</button>
          </div>
          <div style={{ maxWidth: 780, margin: "6px auto 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <span style={{ fontSize: 10, color: "var(--dim)", fontFamily: "var(--mono)" }}>{model.icon} {model.name}</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,.08)" }}>{"\u00B7"}</span>
            <span style={{ fontSize: 10, color: "var(--dim)", fontFamily: "var(--mono)" }}>{currentMode.label}</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,.08)" }}>{"\u00B7"}</span>
            <span style={{ fontSize: 10, color: "var(--dim)", fontFamily: "var(--mono)" }}>Shift+Enter for newline</span>
          </div>
        </div>
      </div>
      {settingsOpen && (
        <>
          <div onClick={function() { setSettingsOpen(false); }} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 40 }} />
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 320, background: "var(--bg3)", borderLeft: "1px solid var(--border)", padding: 22, zIndex: 50, overflow: "auto", animation: "slideUp .2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Settings</div>
              <button onClick={function() { setSettingsOpen(false); }} style={{ background: "none", border: "none", color: "var(--dim)", fontSize: 18, cursor: "pointer" }}>{"\u2715"}</button>
            </div>
            {[{ title: "Account", items: ["Profile", "Subscription", "API Keys", "Billing"] }, { title: "AI Models", items: ["Default Model", "Temperature", "System Prompt"] }, { title: "Integrations", items: ["Webhooks", "Zapier", "Slack", "REST API"] }, { title: "Interface", items: ["Theme", "Language", "Shortcuts"] }].map(function(s, i) { return (
              <div key={i} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#00f5d4", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8, fontFamily: "var(--mono)" }}>{s.title}</div>
                {s.items.map(function(item, j) { return (
                  <div key={j} style={{ padding: "9px 10px", borderRadius: 7, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>{item}</span><span style={{ color: "var(--dim)", fontSize: 11 }}>{"\u2192"}</span>
                  </div>
                ); })}
              </div>
            ); })}
            <div style={{ marginTop: 12, padding: 14, borderRadius: 10, background: "rgba(0,245,212,.04)", border: "1px solid rgba(0,245,212,.1)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#00f5d4", marginBottom: 3, fontFamily: "var(--mono)" }}>PRO PLAN</div>
              <div style={{ fontSize: 11, color: "var(--dim)", lineHeight: 1.5 }}>Unlimited requests, all models, API access, priority support</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
