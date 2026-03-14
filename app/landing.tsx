"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const FEATURES = [
  {
    icon: "⬡",
    title: "Multi-Model AI",
    desc: "Switch between Claude Sonnet and GPT-4o in a single conversation. Pick the right brain for the job.",
    accent: "#6366f1",
  },
  {
    icon: "⚡",
    title: "Real-Time Streaming",
    desc: "Watch AI think in real time. No waiting for full responses — words appear as they're generated.",
    accent: "#f59e0b",
  },
  {
    icon: "◈",
    title: "Web Search",
    desc: "Search the live web with AI reasoning. Get answers grounded in current information, not stale training data.",
    accent: "#10b981",
  },
  {
    icon: "⊟",
    title: "Side-by-Side Compare",
    desc: "Run the same prompt against multiple models simultaneously. See exactly how they differ.",
    accent: "#3b82f6",
  },
  {
    icon: "◐",
    title: "5 Powerful Modes",
    desc: "Chat, Search, Generate, Agent, Code — each mode is purpose-built for a different kind of work.",
    accent: "#ec4899",
  },
  {
    icon: "◉",
    title: "Persistent Memory",
    desc: "Your conversations are saved and searchable. Context carries forward. Nothing gets lost.",
    accent: "#8b5cf6",
  },
];

const PRICING = [
  {
    name: "Free",
    price: "0",
    period: "forever",
    description: "Try TraceRemove AI at no cost.",
    features: [
      "15 messages per day",
      "Access to TR Fast model",
      "Web Search mode",
      "Conversation history (7 days)",
    ],
    cta: "Start free",
    href: "/sign-up",
    featured: false,
  },
  {
    name: "Pro",
    price: "20",
    period: "month",
    description: "Everything you need for serious AI work.",
    features: [
      "Unlimited messages",
      "All 4 AI models",
      "All 5 modes including Agent",
      "Side-by-Side Compare",
      "Persistent memory",
      "Priority response speed",
    ],
    cta: "Get Pro",
    href: "/sign-up?plan=pro",
    featured: true,
  },
];

const MODES = ["Chat", "Search", "Generate", "Agent", "Code"];

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const duration = 1200;
          const step = (timestamp: number, startTime: number) => {
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame((t) => step(t, startTime));
          };
          requestAnimationFrame((t) => step(t, t));
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function Landing() {
  const [activeMode, setActiveMode] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveMode((prev) => (prev + 1) % MODES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#080808] text-white overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute top-[30%] right-[-5%] w-[500px] h-[500px] rounded-full bg-violet-600/8 blur-[100px]" />
        <div className="absolute bottom-[10%] left-[30%] w-[400px] h-[400px] rounded-full bg-blue-600/8 blur-[100px]" />
      </div>

      {/* Nav */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#080808]/90 backdrop-blur-xl border-b border-white/5"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold">
              TR
            </div>
            <span className="font-semibold text-[15px] tracking-tight">
              TraceRemove<span className="text-indigo-400"> AI</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#modes" className="hover:text-white transition-colors">
              Modes
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="text-sm px-4 py-1.5 rounded-full bg-white text-black font-medium hover:bg-white/90 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 pb-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Claude Sonnet · GPT-4o · Live now
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
            AI that thinks
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
              in{" "}
              <span
                key={activeMode}
                className="inline-block animate-[fadeIn_0.3s_ease]"
              >
                {MODES[activeMode]}
              </span>{" "}
              mode
            </span>
          </h1>

          <p className="text-xl text-white/50 max-w-xl mx-auto mb-10 leading-relaxed">
            One platform. Multiple frontier models. Five modes built for every
            kind of AI work — from quick questions to autonomous agents.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-500 transition-colors font-medium text-sm"
            >
              Start for free
            </Link>
            <Link
              href="/sign-in"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all font-medium text-sm text-white/70"
            >
              Sign in →
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: 4, suffix: " models", label: "AI models" },
              { value: 5, suffix: " modes", label: "Work modes" },
              { value: 0, suffix: "$ free", label: "To start" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-white">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-xs text-white/30 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modes bar */}
      <section id="modes" className="py-16 px-6 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs text-white/30 uppercase tracking-widest mb-8">
            Five modes, one platform
          </p>
          <div className="grid grid-cols-5 gap-2">
            {MODES.map((mode, i) => (
              <button
                key={mode}
                onClick={() => setActiveMode(i)}
                className={`py-3 rounded-xl text-sm font-medium transition-all ${
                  activeMode === i
                    ? "bg-indigo-600 text-white"
                    : "bg-white/5 text-white/40 hover:bg-white/8 hover:text-white/60"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <div className="mt-6 p-5 rounded-2xl bg-white/3 border border-white/5 min-h-[80px] flex items-center">
            <p className="text-sm text-white/50 leading-relaxed">
              {activeMode === 0 &&
                "Natural conversation with frontier AI. Ask questions, get explanations, brainstorm ideas — the classic AI experience, done right."}
              {activeMode === 1 &&
                "Search the live web with AI reasoning. Get answers grounded in current information, not stale training data from months ago."}
              {activeMode === 2 &&
                "Generate images, documents, and content with AI. Describe what you want and watch it come to life in seconds."}
              {activeMode === 3 &&
                "Autonomous AI agents that can browse, code, and execute multi-step tasks. Set a goal and let the AI figure out how to get there."}
              {activeMode === 4 &&
                "Write, review, and debug code with dedicated AI support. Syntax highlighting, error detection, and multi-language support built in."}
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need
            </h2>
            <p className="text-white/40 max-w-md mx-auto">
              Built for people who take AI seriously. Every feature designed to
              remove friction, not add it.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl bg-white/3 border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all duration-300"
              >
                <div
                  className="text-2xl mb-4"
                  style={{ color: feature.accent }}
                >
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-[15px] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Model comparison */}
      <section className="py-20 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs text-white/30 uppercase tracking-widest mb-10">
            Your models
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                id: "TR Ultra",
                base: "Claude Sonnet",
                tag: "Most capable",
                color: "#6366f1",
                desc: "Deep reasoning, nuanced writing, complex analysis",
              },
              {
                id: "TR Fast",
                base: "GPT-4o",
                tag: "Fastest",
                color: "#10b981",
                desc: "Rapid responses, great for quick tasks and iteration",
              },
              {
                id: "TR Creative",
                base: "Claude Sonnet",
                tag: "Creative",
                color: "#ec4899",
                desc: "Optimized for creative writing and imaginative output",
              },
              {
                id: "TR Agent",
                base: "GPT-4o",
                tag: "Autonomous",
                color: "#f59e0b",
                desc: "Tool use, browsing, and multi-step task execution",
              },
            ].map((model) => (
              <div
                key={model.id}
                className="p-5 rounded-2xl bg-white/3 border border-white/5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p
                      className="font-semibold text-[15px]"
                      style={{ color: model.color }}
                    >
                      {model.id}
                    </p>
                    <p className="text-xs text-white/30">{model.base}</p>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: model.color + "18",
                      color: model.color,
                    }}
                  >
                    {model.tag}
                  </span>
                </div>
                <p className="text-sm text-white/40">{model.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-28 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple pricing
            </h2>
            <p className="text-white/40">
              Start free. Upgrade when you need more.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`p-7 rounded-2xl border transition-all ${
                  plan.featured
                    ? "bg-indigo-600/10 border-indigo-500/30"
                    : "bg-white/3 border-white/5"
                }`}
              >
                {plan.featured && (
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 mb-4">
                    Most popular
                  </span>
                )}
                <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-white/40 text-sm">/{plan.period}</span>
                </div>
                <p className="text-sm text-white/40 mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <span className="text-indigo-400 text-xs">✓</span>
                      <span className="text-white/70">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block w-full text-center py-3 rounded-xl font-medium text-sm transition-all ${
                    plan.featured
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                      : "bg-white/8 hover:bg-white/12 text-white/80"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Ready to think
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              without limits?
            </span>
          </h2>
          <p className="text-white/40 mb-10">
            Join thousands using TraceRemove AI to do their best work.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition-colors"
          >
            Get started free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[9px] font-bold">
              TR
            </div>
            <span className="text-sm text-white/30">
              TraceRemove AI © 2026
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-white/30">
            <a href="#" className="hover:text-white/60 transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-white/60 transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-white/60 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}
