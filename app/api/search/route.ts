import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "TAVILY_API_KEY not set" }, { status: 500 });

    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "advanced",
        include_answer: true,
        max_results: 5,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Search failed" }, { status: 500 });
  }
}
