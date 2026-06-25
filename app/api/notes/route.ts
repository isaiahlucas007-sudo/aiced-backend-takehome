import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createUserClient } from "@/lib/supabase";

/**
 * GET /api/notes
 * Returns the notes the caller is allowed to see. No tenant filtering happens
 * here — the `notes` RLS policy is the source of truth (same as documents).
 */
export async function GET(req: NextRequest) {
  const supabase = createUserClient(req);

  const { data, error } = await supabase
    .from("notes")
    .select("id, group_id, author_id, body, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notes: data });
}

const CreateNote = z.object({
  group_id: z.string().uuid(),
  body: z.string().trim().min(1, "body is required").max(10_000),
});

/**
 * POST /api/notes
 * Creates a note in a group the caller belongs to. `author_id` comes from the
 * caller's session — never the request body — and RLS enforces both membership
 * and authorship as a backstop.
 */
export async function POST(req: NextRequest) {
  const supabase = createUserClient(req);

  // Resolve the caller from their bearer token, not from the request body.
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: auth, error: authError } = await supabase.auth.getUser(token);
  if (authError || !auth?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateNote.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { group_id, body } = parsed.data;

  const { data, error } = await supabase
    .from("notes")
    .insert({ group_id, body, author_id: auth.user.id })
    .select("id, group_id, author_id, body, created_at, updated_at")
    .single();

  if (error) {
    // RLS WITH CHECK violation → caller isn't a member of that group.
    if (error.code === "42501") {
      return NextResponse.json(
        { error: "You don't have access to that group" },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ note: data }, { status: 201 });
}
