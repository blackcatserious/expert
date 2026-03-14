"use client";
import { useState, useEffect, useRef, useCallback, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useUser, UserButton, SignedIn, SignedOut, useClerk } from "@clerk/nextjs";
import Landing from "./landing";

const MODELS = [
  { id: "tr-ultra", name: "TR Ultra", desc: "Claude Sonnet — precision", icon: "\u25C6", color: "#00f5d4" },
  { id: "tr-fast", name: "TR Fast", desc: "GPT-4o-mini — speed", icon: "\u26A1", color: "#fbbf24" },
  { id: "tr-creative", name: "TR Creative", desc: "Claude — creative", icon: "\u2726", color: "#c084fc" },
  { id: "tr-agent", name: "TR Agent", desc: "GPT-4o — agents", icon: "\u25CE", color: "#f472b6" },
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
const QUICK = [
  { text: "Analyze my competitors", sub: "Deep market research" },
  { text: "Write production code", sub: "API, frontend, backend" },
  { text: "Generate visual content", sub: "Images, diagrams, mockups" },
  { text: "Research any topic", sub: "With verified sources" },
];
interface Msg { role: string; content: string; error?: boolean; }
interface Conv { id: string; title: string; mode: string; model: string; updated_at: string; messages?: { id: string; role: string; content: string; created_at: string }[]; }

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return mobile;
}

function CodeBlock({ className, children }: { className?: string; children: string }) {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace("language-", "") || "";
  const code = String(children).replace(/\n$/, "");
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div style={{ position: "relative", margin: "12px 0", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(255,255,255,.06)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", background: "rgba(255,255,255,.03)", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
        <span style={{ fontSize: 11, color: "var(--dim)", fontFamily: "var(--mono)", fontWeight: 600, textTransform: "uppercase" }}>{lang || "code"}</span>
        <button onClick={copy} style={{ background: "none", border: "none", color: copied ? "#00f5d4" : "var(--dim)", fontSize: 11, cursor: "pointer", fontFamily: "var(--mono)", display: "flex", alignItems: "center", gap: 4 }}>
          {copied ? "\u2713 Copied" : "\u2398 Copy"}
        </button>
      </div>
      <pre style={{ margin: 0, padding: "14px 16px", background: "rgba(0,0,0,.3)", overflowX: "auto", fontSize: 13, lineHeight: 1.6, fontFamily: "var(--mono)" }}>
        <code style={{ color: "#e4e4ed" }}>{code}</code>
      </pre>
    </div>
  );
}

const MarkdownContent = memo(function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
      code({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: unknown }) {
        const isBlock = className?.startsWith("language-") || String(children).includes("\n");
        if (isBlock) return <CodeBlock className={className}>{String(children)}</CodeBlock>;
        return <code style={{ background: "rgba(0,245,212,.08)", color: "#00f5d4", padding: "1px 6px", borderRadius: 4, fontSize: 13, fontFamily: "var(--mono)" }} {...props}>{children}</code>;
      },
      p({ children }) { return <p style={{ margin: "8px 0", lineHeight: 1.75 }}>{children}</p>; },
      h1({ children }) { return <h1 style={{ fontSize: 20, fontWeight: 700, margin: "16px 0 8px" }}>{children}</h1>; },
      h2({ children }) { return <h2 style={{ fontSize: 17, fontWeight: 700, margin: "14px 0 6px" }}>{children}</h2>; },
      h3({ children }) { return <h3 style={{ fontSize: 15, fontWeight: 700, margin: "12px 0 4px" }}>{children}</h3>; },
      ul({ children }) { return <ul style={{ margin: "8px 0", paddingLeft: 20, listStyleType: "disc" }}>{children}</ul>; },
      ol({ children }) { return <ol style={{ margin: "8px 0", paddingLeft: 20 }}>{children}</ol>; },
      li({ children }) { return <li style={{ margin: "3px 0", lineHeight: 1.65 }}>{children}</li>; },
      blockquote({ children }) { return <blockquote style={{ borderLeft: "3px solid #00f5d4", paddingLeft: 14, margin: "10px 0", color: "var(--dim2)", fontStyle: "italic" }}>{children}</blockquote>; },
      a({ href, children }) { return <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#00f5d4", textDecoration: "underline", textUnderlineOffset: 3 }}>{children}</a>; },
      table({ children }) { return <div style={{ overflowX: "auto", margin: "10px 0" }}><table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>{children}</table></div>; },
      th({ children }) { return <th style={{ padding: "8px 12px", borderBottom: "2px solid rgba(255,255,255,.1)", textAlign: "left", fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "var(--mono)" }}>{children}</th>; },
      td({ children }) { return <td style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>{children}</td>; },
      strong({ children }) { return <strong style={{ fontWeight: 700, color: "#fff" }}>{children}</strong>; },
      hr() { return <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,.06)", margin: "16px 0" }} />; },
    }}>{content}</ReactMarkdown>
  );
});

function Spinner() {
  const [f, setF] = useState(0);
  const ch = ["\u280B","\u2819","\u2839","\u2838","\u283C","\u2834","\u2826","\u2827","\u2807","\u280F"];
  useEffect(() => { const t = setInterval(() => setF(x => (x + 1) % ch.length), 80); return () => clearInterval(t); }, []);
  return <span style={{ color: "var(--cyan)", fontFamily: "var(--mono)" }}>{ch[f]} Thinking</span>;
}

function ErrorBubble({ content }: { content: string }) {
  let msg = content;
  try { const p = JSON.parse(content.replace(/^Error:\s*/, "")); msg = p?.error?.message || p?.message || content; } catch {}
  if (msg.includes("credit balance")) msg = "Anthropic credits exhausted. Top up at console.anthropic.com";
  if (msg.includes("rate_limit")) msg = "Too many requests. Wait a moment.";
  if (msg.includes("overloaded")) msg = "AI model temporarily overloaded.";
  if (msg.includes("invalid_api_key") || msg.includes("not set")) msg = "API key not configured.";
  return (
    <div style={{ display: "flex", gap: 14, animation: "slideUp .3s ease both", marginBottom: 6 }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: "linear-gradient(135deg,#ef4444,#dc2626)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontSize: 15, fontWeight: 800, color: "#fff", marginTop: 4 }}>!</div>
      <div style={{ maxWidth: "85%", padding: "14px 18px", background: "rgba(239,68,68,.06)", border: "1px solid rgba(239,68,68,.15)", borderRadius: "16px 16px 16px 4px", fontSize: 14, lineHeight: 1.75, color: "#fca5a5" }}>{msg}</div>
    </div>
  );
}

function MsgBubble({ msg, streaming, isMobile }: { msg: Msg; streaming?: boolean; isMobile: boolean }) {
  const isUser = msg.role === "user";
  if (msg.error) return <ErrorBubble content={msg.content} />;
  return (
    <div style={{ display: "flex", gap: isMobile ? 10 : 14, justifyContent: isUser ? "flex-end" : "flex-start", animation: "slideUp .3s ease both", marginBottom: 6 }}>
      {!isUser && <div style={{ width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, borderRadius: 9, flexShrink: 0, background: "linear-gradient(135deg,#00f5d4,#00b4d8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontSize: isMobile ? 11 : 13, fontWeight: 800, color: "#060609", marginTop: 4 }}>TR</div>}
      <div style={{ maxWidth: isMobile ? "88%" : "72%", padding: isMobile ? "12px 14px" : "14px 18px", background: isUser ? "rgba(0,245,212,.07)" : "rgba(255,255,255,.025)", border: "1px solid " + (isUser ? "rgba(0,245,212,.15)" : "rgba(255,255,255,.04)"), borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px", fontSize: isMobile ? 13 : 14, lineHeight: 1.75, color: "#e4e4ed" }}>
        {isUser ? msg.content : <MarkdownContent content={msg.content} />}
        {streaming && <span style={{ color: "#00f5d4", animation: "blink 1s infinite" }}>{"\u258D"}</span>}
      </div>
    </div>
  );
}

function timeAgo(date: string) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  if (s < 604800) return Math.floor(s / 86400) + "d ago";
  return new Date(date).toLocaleDateString();
}

export default function Home() {
  const { user } = useUser();
  const isMobile = useIsMobile();
  const [sidebar, setSidebar] = useState(false);
  const [mode, setMode] = useState("chat");
  const [model, setModel] = useState(MODELS[0]);
  const [modelDrop, setModelDrop] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [agents, setAgents] = useState(["researcher"]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [genType, setGenType] = useState("text");
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [activeConv, setActiveConv] = useState<string | null>(null);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [compareResults, setCompareResults] = useState<{claude?: {text?: string; error?: string; model?: string; icon?: string; color?: string}; gpt?: {text?: string; error?: string; model?: string; icon?: string; color?: string}} | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Show sidebar by default on desktop
  useEffect(() => { if (!isMobile) setSidebar(true); }, [isMobile]);

  useEffect(() => {
    fetch("/api/conversations").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setConversations(data);
      setLoadingConvs(false);
    }).catch(() => setLoadingConvs(false));
  }, []);

  const closeSidebarMobile = useCallback(() => { if (isMobile) setSidebar(false); }, [isMobile]);

  const loadConversation = useCallback((conv: Conv) => {
    setActiveConv(conv.id);
    setMode(conv.mode || "chat");
    const m = MODELS.find(x => x.id === conv.model);
    if (m) setModel(m);
    if (conv.messages && conv.messages.length > 0) {
      const sorted = [...conv.messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setMessages(sorted.map(m => ({ role: m.role, content: m.content })));
    } else { setMessages([]); }
    closeSidebarMobile();
  }, [closeSidebarMobile]);

  const newConversation = useCallback(() => {
    setActiveConv(null); setMessages([]);
    if (abortRef.current) abortRef.current.abort();
    setLoading(false); setStreaming(false);
    closeSidebarMobile();
  }, [closeSidebarMobile]);

  const deleteConversation = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConv === id) newConversation();
  }, [activeConv, newConversation]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading, streaming]);

  const sendCompare = useCallback(async () => {
    if (!input.trim() || compareLoading) return;
    const q = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setInput(''); setCompareLoading(true); setCompareResults(null);
    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: q }], mode }),
      });
      const data = await res.json();
      setCompareResults(data);
    } catch { setCompareResults({ claude: { error: 'Failed' }, gpt: { error: 'Failed' } }); }
    setCompareLoading(false);
  }, [input, compareLoading, mode]);

  const send = useCallback(async () => {
    if (compareMode) { sendCompare(); return; }
    if (!input.trim() || loading) return;
    const q = input.trim();
    const userMsg: Msg = { role: "user", content: q };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput(""); setLoading(true);
    let convId = activeConv;
    try {
      if (!convId) {
        const res = await fetch("/api/conversations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: q.slice(0, 80), mode, model: model.id }) });
        const conv = await res.json();
        convId = conv.id; setActiveConv(conv.id);
        setConversations(prev => [conv, ...prev]);
      }
      await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: convId, role: "user", content: q }) });
      abortRef.current = new AbortController();
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })), modelId: model.id, mode }), signal: abortRef.current.signal });
      if (!res.ok) { const errText = await res.text(); setMessages(prev => [...prev, { role: "ai", content: errText, error: true }]); setLoading(false); return; }
      setLoading(false); setStreaming(true);
      setMessages(prev => [...prev, { role: "ai", content: "" }]);
      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let buffer = "", fullText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n"); buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try { const parsed = JSON.parse(data); if (parsed.text) { fullText += parsed.text; setMessages(prev => { const u = [...prev]; u[u.length - 1] = { role: "ai", content: fullText }; return u; }); } } catch {}
          }
        }
      }
      if (convId && fullText) {
        fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: convId, role: "ai", content: fullText }) });
        setConversations(prev => prev.map(c => c.id === convId ? { ...c, updated_at: new Date().toISOString() } : c));
      }
      setStreaming(false);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setMessages(prev => [...prev, { role: "ai", content: "Connection error. Please try again.", error: true }]);
      setLoading(false); setStreaming(false);
    }
  }, [input, loading, messages, model.id, mode, activeConv, compareMode, sendCompare]);

  const currentMode = MODES.find(m => m.id === mode) || MODES[0];
  const sidebarW = isMobile ? 280 : 272;

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", background: "var(--bg)", color: "var(--fg)", fontFamily: "var(--sans)", overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", top: -300, right: -200, width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,245,212,.015) 0%,transparent 65%)", pointerEvents: "none" }} />

      {/* MOBILE BACKDROP */}
      {isMobile && sidebar && (
        <div onClick={() => setSidebar(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 9, backdropFilter: "blur(2px)" }} />
      )}

      {/* SIDEBAR */}
      <div style={{
        width: sidebar ? sidebarW : 0,
        height: "100vh",
        background: "var(--sidebar)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        transition: "all .25s cubic-bezier(.4,0,.2,1)",
        overflow: "hidden", flexShrink: 0, zIndex: 10,
        ...(isMobile ? { position: "fixed", left: sidebar ? 0 : -sidebarW, top: 0, bottom: 0, width: sidebarW, boxShadow: sidebar ? "4px 0 30px rgba(0,0,0,.5)" : "none" } : {}),
      }}>
        <div style={{ minWidth: sidebarW, height: "100%", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "18px 18px 14px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--border)" }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: "linear-gradient(135deg,#00f5d4,#00b4d8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontSize: 14, fontWeight: 800, color: "#060609", boxShadow: "0 4px 24px rgba(0,245,212,.25)" }}>TR</div>
            <div><div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3 }}>TraceRemove</div><div style={{ fontSize: 11, color: "var(--dim)", fontFamily: "var(--mono)", fontWeight: 500 }}>AI Platform</div></div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 10, color: "var(--dim)", background: "rgba(0,245,212,.08)", padding: "2px 8px", borderRadius: 20, fontFamily: "var(--mono)", fontWeight: 600 }}>v2.3</div>
              {isMobile && <button onClick={() => setSidebar(false)} style={{ background: "none", border: "none", color: "var(--dim)", fontSize: 18, cursor: "pointer", padding: 2 }}>{"\u2715"}</button>}
            </div>
          </div>
          <div style={{ padding: "14px 14px 6px" }}>
            <button onClick={newConversation} style={{ width: "100%", padding: "10px 14px", background: "linear-gradient(135deg,rgba(0,245,212,.1),rgba(0,180,216,.05))", border: "1px solid rgba(0,245,212,.15)", borderRadius: 9, color: "#00f5d4", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit" }}>
              <span style={{ fontSize: 16, fontWeight: 300 }}>+</span> New conversation
            </button>
          </div>
          <div style={{ padding: "10px 14px 4px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--dim)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6, paddingLeft: 4, fontFamily: "var(--mono)" }}>Mode</div>
            {MODES.map(m => (
              <div key={m.id} onClick={() => { setMode(m.id); newConversation(); }} style={{ padding: "8px 10px", borderRadius: 8, display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 1, background: mode === m.id ? "rgba(0,245,212,.06)" : "transparent", borderLeft: mode === m.id ? "2px solid #00f5d4" : "2px solid transparent" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: mode === m.id ? "#060609" : "var(--dim)", background: mode === m.id ? "#00f5d4" : "rgba(255,255,255,.05)", padding: "2px 6px", borderRadius: 4, textTransform: "uppercase" }}>{m.tag}</div>
                <span style={{ fontSize: 13, fontWeight: mode === m.id ? 600 : 500, color: mode === m.id ? "#00f5d4" : "var(--fg)" }}>{m.label}</span>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "8px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--dim)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6, paddingLeft: 4, fontFamily: "var(--mono)" }}>Conversations</div>
            {loadingConvs ? (
              <div style={{ padding: 10, fontSize: 12, color: "var(--dim)" }}>Loading...</div>
            ) : conversations.length === 0 ? (
              <div style={{ padding: 10, fontSize: 12, color: "var(--dim)" }}>No conversations yet</div>
            ) : conversations.map(c => {
              const mo = MODES.find(m => m.id === c.mode);
              return (
                <div key={c.id} onClick={() => loadConversation(c)} style={{ padding: "7px 10px", borderRadius: 7, cursor: "pointer", marginBottom: 1, display: "flex", alignItems: "center", gap: 8, background: activeConv === c.id ? "rgba(0,245,212,.06)" : "transparent" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 600, color: activeConv === c.id ? "#060609" : "var(--dim)", background: activeConv === c.id ? "#00f5d4" : "rgba(255,255,255,.04)", padding: "1px 5px", borderRadius: 3, textTransform: "uppercase" }}>{mo ? mo.tag : "CH"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 500, color: activeConv === c.id ? "#00f5d4" : "var(--dim2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</div></div>
                  <div style={{ fontSize: 10, color: "var(--dim)", fontFamily: "var(--mono)", flexShrink: 0 }}>{timeAgo(c.updated_at)}</div>
                  <div onClick={(e) => deleteConversation(c.id, e)} style={{ fontSize: 12, color: "var(--dim)", cursor: "pointer", padding: "2px 4px", borderRadius: 4, opacity: 0.5 }} onMouseEnter={e => (e.currentTarget.style.opacity = "1")} onMouseLeave={e => (e.currentTarget.style.opacity = "0.5")}>{"\u2715"}</div>
                </div>
              );
            })}
          </div>
          {!isMobile && (
            <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--dim)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6, paddingLeft: 4, fontFamily: "var(--mono)" }}>Ecosystem</div>
              {[{ label: "API Console", tag: "API" }, { label: "Documentation", tag: "DOC" }, { label: "Marketplace", tag: "MKT" }].map((item, i) => (
                <div key={i} style={{ padding: "6px 10px", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, marginBottom: 1 }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 9, fontWeight: 600, color: "var(--dim)", background: "rgba(255,255,255,.03)", padding: "1px 5px", borderRadius: 3 }}>{item.tag}</div>
                  <span style={{ fontSize: 12, color: "var(--dim)" }}>{item.label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--dim)", opacity: 0.5 }}>{"\u2197"}</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
            <UserButton afterSignOutUrl="/sign-in" appearance={{ elements: { avatarBox: { width: 30, height: 30 } } }} />
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.fullName || "User"}</div><div style={{ fontSize: 10, color: "var(--dim)", fontFamily: "var(--mono)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.primaryEmailAddress?.emailAddress || ""}</div></div>
            {!isMobile && <div onClick={() => setSettingsOpen(!settingsOpen)} style={{ cursor: "pointer", color: "var(--dim)", fontSize: 14, padding: 4, borderRadius: 6 }}>{"\u2699"}</div>}
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* TOP BAR */}
        <div style={{ height: isMobile ? 48 : 52, padding: isMobile ? "0 12px" : "0 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: isMobile ? 8 : 14, background: "var(--bg2)", flexShrink: 0 }}>
          <button onClick={() => setSidebar(!sidebar)} style={{ background: "none", border: "none", color: "var(--dim)", fontSize: 18, cursor: "pointer", padding: "4px 6px", borderRadius: 5 }}>{"\u2630"}</button>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 10, flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, color: "#060609", background: "#00f5d4", padding: "2px 7px", borderRadius: 4, letterSpacing: 0.5, textTransform: "uppercase", flexShrink: 0 }}>{currentMode.tag}</div>
            <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700 }}>{currentMode.label}</span>
            {!isMobile && <span style={{ fontSize: 11, color: "var(--dim)", fontWeight: 500 }}>{currentMode.desc}</span>}
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={() => setModelDrop(!modelDrop)} style={{ background: "rgba(255,255,255,.03)", border: "1px solid var(--border)", borderRadius: 8, padding: isMobile ? "4px 8px" : "5px 12px", color: "var(--fg)", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: isMobile ? 4 : 7, fontFamily: "inherit" }}>
              <span style={{ color: model.color, fontSize: 14 }}>{model.icon}</span>
              {isMobile ? "" : model.name}
              <span style={{ color: "var(--dim)", fontSize: 8 }}>{"\u25BC"}</span>
            </button>
            {modelDrop && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 11, padding: 5, minWidth: 220, boxShadow: "0 20px 60px rgba(0,0,0,.5)", zIndex: 100, animation: "slideUp .15s ease" }}>
                {MODELS.map(m => (
                  <div key={m.id} onClick={() => { setModel(m); setModelDrop(false); }} style={{ padding: "9px 12px", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, background: model.id === m.id ? "rgba(0,245,212,.05)" : "transparent" }}>
                    <span style={{ fontSize: 16, color: m.color }}>{m.icon}</span>
                    <div><div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div><div style={{ fontSize: 11, color: "var(--dim)" }}>{m.desc}</div></div>
                    {model.id === m.id && <span style={{ marginLeft: "auto", color: "#00f5d4", fontSize: 13, fontFamily: "var(--mono)" }}>{"\u2713"}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          {!isMobile && <>
            {!isMobile && <button onClick={() => { setCompareMode(!compareMode); setCompareResults(null); }} style={{ background: compareMode ? 'rgba(192,132,252,.15)' : 'rgba(255,255,255,.03)', border: '1px solid ' + (compareMode ? 'rgba(192,132,252,.3)' : 'var(--border)'), borderRadius: 8, padding: '5px 12px', color: compareMode ? '#c084fc' : 'var(--dim)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>↔ Compare</button>}
          <div style={{ width: 1, height: 20, background: "var(--border)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px rgba(34,197,94,.4)" }} />
              <span style={{ fontSize: 11, color: "var(--dim)", fontFamily: "var(--mono)" }}>Online</span>
            </div>
          </>}
        </div>

        {mode === "agents" && (
          <div style={{ padding: isMobile ? "10px 12px" : "14px 22px", borderBottom: "1px solid var(--border)", background: "var(--bg2)", animation: "slideUp .25s ease" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--dim)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10, fontFamily: "var(--mono)" }}>Select agents</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fill,minmax(190px,1fr))", gap: 8 }}>
              {AGENTS.map(a => { const on = agents.includes(a.id); return (
                <div key={a.id} onClick={() => setAgents(p => p.includes(a.id) ? p.filter(x => x !== a.id) : [...p, a.id])} style={{ background: on ? "rgba(0,245,212,.06)" : "rgba(255,255,255,.015)", border: "1px solid " + (on ? "rgba(0,245,212,.25)" : "rgba(255,255,255,.05)"), borderRadius: 12, padding: isMobile ? "10px 12px" : "14px 16px", cursor: "pointer", position: "relative", overflow: "hidden" }}>
                  {on && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#00f5d4,transparent)" }} />}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 700, color: on ? "#060609" : "var(--dim)", background: on ? "#00f5d4" : "rgba(255,255,255,.06)", padding: "2px 6px", borderRadius: 4 }}>{a.tag}</div>
                    <span style={{ fontSize: isMobile ? 12 : 14, fontWeight: 700, color: on ? "var(--fg)" : "var(--dim2)" }}>{a.name}</span>
                  </div>
                  {!isMobile && <div style={{ fontSize: 12, color: "var(--dim)", lineHeight: 1.45 }}>{a.desc}</div>}
                </div>
              ); })}
            </div>
          </div>
        )}

        {mode === "generate" && (
          <div style={{ padding: isMobile ? "8px 12px" : "10px 22px", borderBottom: "1px solid var(--border)", background: "var(--bg2)", display: "flex", gap: 6, animation: "slideUp .25s ease", overflowX: "auto" }}>
            {["text", "image", "audio", "video"].map(t => (
              <button key={t} onClick={() => setGenType(t)} style={{ padding: "6px 14px", borderRadius: 20, background: genType === t ? "rgba(0,245,212,.1)" : "transparent", border: "1px solid " + (genType === t ? "rgba(0,245,212,.25)" : "var(--border)"), color: genType === t ? "#00f5d4" : "var(--dim)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize", whiteSpace: "nowrap" }}>{t}</button>
            ))}
          </div>
        )}

        {/* CHAT AREA */}
        <div style={{ flex: 1, overflow: "auto", padding: isMobile ? "16px 12px" : "24px 20px" }}>
          {messages.length === 0 ? (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", animation: "fadeIn .5s ease", padding: isMobile ? "0 8px" : 0 }}>
              <div style={{ width: isMobile ? 52 : 64, height: isMobile ? 52 : 64, borderRadius: 16, background: "linear-gradient(135deg,#00f5d4,#00b4d8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontSize: isMobile ? 18 : 22, fontWeight: 800, color: "#060609", marginBottom: 20, boxShadow: "0 8px 40px rgba(0,245,212,.15)", animation: "glowPulse 4s ease infinite" }}>TR</div>
              <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, marginBottom: 6, letterSpacing: -1, textAlign: "center" }}>What can I help with?</div>
              <div style={{ fontSize: isMobile ? 13 : 14, color: "var(--dim)", marginBottom: isMobile ? 24 : 36, textAlign: "center", maxWidth: 420, lineHeight: 1.6 }}>Chat, search, generate, code, or deploy autonomous agents.</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, maxWidth: 520, width: "100%" }}>
                {QUICK.map((q, i) => (
                  <button key={i} onClick={() => setInput(q.text)} style={{ padding: isMobile ? "12px 14px" : "14px 16px", borderRadius: 11, background: "rgba(255,255,255,.02)", border: "1px solid var(--border)", color: "var(--fg)", textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{q.text}</div>
                    <div style={{ fontSize: 11, color: "var(--dim)" }}>{q.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: 780, margin: "0 auto" }}>
              {messages.map((msg, i) => <MsgBubble key={i} msg={msg} streaming={streaming && i === messages.length - 1 && msg.role === "ai"} isMobile={isMobile} />)}
              {loading && (
                <div style={{ display: "flex", gap: 14, animation: "slideUp .3s ease", marginBottom: 6 }}>
                  <div style={{ width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, borderRadius: 9, flexShrink: 0, background: "linear-gradient(135deg,#00f5d4,#00b4d8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontSize: isMobile ? 11 : 13, fontWeight: 800, color: "#060609" }}>TR</div>
                  <div style={{ padding: "14px 18px", background: "rgba(255,255,255,.025)", border: "1px solid rgba(255,255,255,.04)", borderRadius: "16px 16px 16px 4px" }}><Spinner /></div>
                </div>
              )}
              {compareMode && compareResults && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, margin: '16px 0', animation: 'slideUp .3s ease' }}>
                {[compareResults.claude, compareResults.gpt].map((r, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, overflow: 'hidden' }}>
                    <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.02)' }}>
                      <span style={{ fontSize: 16, color: r?.color || '#888' }}>{r?.icon || '?'}</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{r?.model || (i === 0 ? 'Claude' : 'GPT-4o')}</span>
                    </div>
                    <div style={{ padding: '14px 16px', fontSize: 14, lineHeight: 1.75, maxHeight: 500, overflow: 'auto' }}>
                      {r?.error ? <span style={{ color: '#fca5a5' }}>{r.error}</span> : r?.text ? <MarkdownContent content={r.text} /> : 'No response'}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {compareMode && compareLoading && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, margin: '16px 0' }}>
                {[0, 1].map(i => (
                  <div key={i} style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.06)', borderRadius: 14, padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Spinner />
                  </div>
                ))}
              </div>
            )}
            <div ref={endRef} />
            </div>
          )}
        </div>

        {/* INPUT */}
        <div style={{ padding: isMobile ? "10px 12px 14px" : "14px 20px 18px", borderTop: "1px solid var(--border)", background: "var(--bg2)" }}>
          <div style={{ maxWidth: 780, margin: "0 auto", background: "rgba(255,255,255,.02)", border: "1px solid var(--border)", borderRadius: 14, padding: "4px 4px 4px 14px", display: "flex", alignItems: "flex-end", gap: 6 }} onClick={() => inputRef.current?.focus()}>
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !isMobile) { e.preventDefault(); send(); } }} placeholder={mode === "search" ? "Search anything..." : mode === "generate" ? "Describe what to generate..." : mode === "agents" ? "Describe the task..." : mode === "code" ? "Describe the code..." : "Message TraceRemove..."} rows={1} style={{ flex: 1, background: "none", border: "none", color: "var(--fg)", fontSize: 14, resize: "none", padding: "9px 0", lineHeight: 1.5, maxHeight: 120, outline: "none", fontFamily: "inherit" }} />
            <button style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: input.trim() ? "linear-gradient(135deg,#00f5d4,#00b4d8)" : "rgba(255,255,255,.04)", border: "none", cursor: input.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: input.trim() ? "#060609" : "var(--dim)", fontWeight: 700, transition: "all .2s" }} onClick={send}>{"\u2191"}</button>
          </div>
          {!isMobile && (
            <div style={{ maxWidth: 780, margin: "6px auto 0", display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <span style={{ fontSize: 10, color: "var(--dim)", fontFamily: "var(--mono)" }}>{model.icon} {model.name}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,.08)" }}>{"\u00B7"}</span>
              <span style={{ fontSize: 10, color: "var(--dim)", fontFamily: "var(--mono)" }}>{currentMode.label}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,.08)" }}>{"\u00B7"}</span>
              <span style={{ fontSize: 10, color: "var(--dim)", fontFamily: "var(--mono)" }}>Shift+Enter for newline</span>
            </div>
          )}
        </div>
      </div>

      {/* SETTINGS */}
      {settingsOpen && !isMobile && (
        <>
          <div onClick={() => setSettingsOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 40 }} />
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 320, background: "var(--bg3)", borderLeft: "1px solid var(--border)", padding: 22, zIndex: 50, overflow: "auto", animation: "slideUp .2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>Settings</div>
              <button onClick={() => setSettingsOpen(false)} style={{ background: "none", border: "none", color: "var(--dim)", fontSize: 18, cursor: "pointer" }}>{"\u2715"}</button>
            </div>
            {[{ title: "Account", items: ["Profile", "Subscription", "API Keys", "Billing"] }, { title: "AI Models", items: ["Default Model", "Temperature", "System Prompt"] }, { title: "Integrations", items: ["Webhooks", "Zapier", "Slack", "REST API"] }, { title: "Interface", items: ["Theme", "Language", "Shortcuts"] }].map((s, i) => (
              <div key={i} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#00f5d4", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8, fontFamily: "var(--mono)" }}>{s.title}</div>
                {s.items.map((item, j) => (
                  <div key={j} style={{ padding: "9px 10px", borderRadius: 7, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>{item}</span><span style={{ color: "var(--dim)", fontSize: 11 }}>{"\u2192"}</span>
                  </div>
                ))}
              </div>
            ))}
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
