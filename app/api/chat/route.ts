import { NextRequest } from "next/server";

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const OPENAI_API = "https://api.openai.com/v1/chat/completions";

const MODEL_MAP: Record<string, { provider: "anthropic" | "openai"; model: string; temperature: number }> = {
  "tr-ultra": { provider: "anthropic", model: "claude-sonnet-4-20250514", temperature: 0.3 },
  "tr-fast": { provider: "openai", model: "gpt-4o-mini", temperature: 0.4 },
  "tr-creative": { provider: "anthropic", model: "claude-sonnet-4-20250514", temperature: 0.9 },
  "tr-agent": { provider: "openai", model: "gpt-4o", temperature: 0.5 },
};

const SYSTEM_PROMPTS: Record<string, string> = {
  chat: "You are TraceRemove AI, a powerful AI assistant. Be helpful, concise, and precise. Respond in the same language the user writes in.",
  search: "You are TraceRemove AI in Search mode. Provide comprehensive answers with key facts. Structure your response clearly. Respond in the same language the user writes in.",
  generate: "You are TraceRemove AI in Generate mode. Create high-quality content based on user requests. Be creative and thorough. Respond in the same language the user writes in.",
  agents: "You are TraceRemove AI Agent. Break down complex tasks into steps, analyze thoroughly, and provide actionable results. Respond in the same language the user writes in.",
  code: "You are TraceRemove AI Code assistant. Write clean, production-ready code with explanations. Use best practices and modern patterns. Respond in the same language the user writes in.",
};

export async function POST(req: NextRequest) {
  try {
    const { messages, modelId, mode } = await req.json();

    const config = MODEL_MAP[modelId] || MODEL_MAP["tr-ultra"];
    const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.chat;

    if (config.provider === "anthropic") {
      return streamAnthropic(messages, config, systemPrompt);
    } else {
      return streamOpenAI(messages, config, systemPrompt);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

async function streamAnthropic(
  messages: Array<{ role: string; content: string }>,
  config: { model: string; temperature: number },
  systemPrompt: string
) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }), { status: 500 });
  }

  const anthropicMessages = messages.map((m: { role: string; content: string }) => ({
    role: m.role === "ai" ? "assistant" : m.role,
    content: m.content,
  }));

  const res = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 4096,
      temperature: config.temperature,
      system: systemPrompt,
      messages: anthropicMessages,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ error: err }), { status: res.status });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = res.body?.getReader();
      if (!reader) { controller.close(); return; }
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`));
              }
            } catch {}
          }
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}

async function streamOpenAI(
  messages: Array<{ role: string; content: string }>,
  config: { model: string; temperature: number },
  systemPrompt: string
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY not set" }), { status: 500 });
  }

  const openaiMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m: { role: string; content: string }) => ({
      role: m.role === "ai" ? "assistant" : m.role,
      content: m.content,
    })),
  ];

  const res = await fetch(OPENAI_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      temperature: config.temperature,
      max_tokens: 4096,
      messages: openaiMessages,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return new Response(JSON.stringify({ error: err }), { status: res.status });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = res.body?.getReader();
      if (!reader) { controller.close(); return; }
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              const text = parsed.choices?.[0]?.delta?.content;
              if (text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
            } catch {}
          }
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
