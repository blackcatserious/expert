import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { conversationId, role, content } = await req.json();
    const sb = getSupabaseAdmin();
    // Verify ownership
    const { data: conv } = await sb.from("conversations").select("id").eq("id", conversationId).eq("user_id", userId).single();
    if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // Save message
    const { data, error } = await sb
      .from("messages")
      .insert({ conversation_id: conversationId, role, content })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    // Update conversation timestamp and title if first user message
    const updates: Record<string, string> = { updated_at: new Date().toISOString() };
    if (role === "user") {
      const { count } = await sb.from("messages").select("id", { count: "exact", head: true }).eq("conversation_id", conversationId).eq("role", "user");
      if (count === 1) updates.title = content.slice(0, 80);
    }
    await sb.from("conversations").update(updates).eq("id", conversationId);
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown" }, { status: 500 });
  }
}
