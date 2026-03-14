import { NextRequest } from "next/server";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const OPENAI_API = "https://api.openai.com/v1/chat/completions";

export async function POST(req: NextRequest) {
  const { messages, mode } = await req.json();
  const systemPrompt = "You are TraceRemove AI. Be helpful, concise, precise. Respond in the same language the user writes in.";

  // Call both models in parallel
  const [claudeRes, gptRes] = await Promise.allSettled([
    callClaude(messages, systemPrompt),
    callGPT(messages, systemPrompt),
  ]);

  return new Response(JSON.stringify({
    claude: claudeRes.status === "fulfilled" ? claudeRes.value : { error: "Claude failed" },
    gpt: gptRes.status === "fulfilled" ? gptRes.value : { error: "GPT failed" },
  }), { headers: { "Content-Type": "application/json" } });
}

async function callClaude(messages: Array<{role: string; content: string}>, system: string) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { error: "No API key" };
  const res = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 2048, temperature: 0.3, system, messages: messages.map(m => ({ role: m.role === "ai" ? "assistant" : m.role, content: m.content })) }),
  });
  if (!res.ok) return { error: await res.text() };
  const data = await res.json();
  return { text: data.content?.[0]?.text || "", model: "Claude Sonnet", icon: "\u25C6", color: "#00f5d4" };
}

async function callGPT(messages: Array<{role: string; content: string}>, system: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { error: "No API key" };
  const res = await fetch(OPENAI_API, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify({ model: "gpt-4o", temperature: 0.4, max_tokens: 2048, messages: [{ role: "system", content: system }, ...messages.map(m => ({ role: m.role === "ai" ? "assistant" : m.role, content: m.content }))] }),
  });
  if (!res.ok) return { error: await res.text() };
  const data = await res.json();
  return { text: data.choices?.[0]?.message?.content || "", model: "GPT-4o", icon: "\u25CE", color: "#f472b6" };
}
