#!/bin/bash
cd /workspaces/expert

echo "=== Setting up Supabase chat persistence ==="

# Create lib directory
mkdir -p lib
mkdir -p app/api/conversations

# Create Supabase client
cat > lib/supabase.ts << 'ENDOFFILE'
import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_KEY!;
  return createClient(url, key);
}
ENDOFFILE

# Create conversations API route
cat > app/api/conversations/route.ts << 'ENDOFFILE'
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("conversations")
      .select("*, messages(id, role, content, created_at)")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { title, mode, model } = await req.json();
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("conversations")
      .insert({ user_id: userId, title: title || "New conversation", mode: mode || "chat", model: model || "tr-ultra" })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown" }, { status: 500 });
  }
}
ENDOFFILE

# Create messages API route
mkdir -p app/api/messages
cat > app/api/messages/route.ts << 'ENDOFFILE'
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
ENDOFFILE

# Create delete conversation API
cat > 'app/api/conversations/[id]/route.ts' << 'ENDOFFILE'
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const sb = getSupabaseAdmin();
    const { error } = await sb.from("conversations").delete().eq("id", id).eq("user_id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown" }, { status: 500 });
  }
}
ENDOFFILE

echo "=== Files created ==="
echo "lib/supabase.ts: $(ls lib/supabase.ts 2>/dev/null && echo OK || echo MISSING)"
echo "app/api/conversations/route.ts: $(ls app/api/conversations/route.ts 2>/dev/null && echo OK || echo MISSING)"
echo "app/api/messages/route.ts: $(ls app/api/messages/route.ts 2>/dev/null && echo OK || echo MISSING)"
echo "app/api/conversations/[id]/route.ts: $(ls 'app/api/conversations/[id]/route.ts' 2>/dev/null && echo OK || echo MISSING)"
