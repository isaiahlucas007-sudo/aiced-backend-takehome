import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createUserClient } from "@/lib/supabase";

/**
 * GET /api/notes
 * Returns the notes the caller is allowed to see.
 *
 * Like the documents route, this uses the caller's session (anon key + their
 * JWT), so the `notes` RLS policy decides what comes back. The route does NOT
 * filter by tenant in application code — the database is the source of truth.
 */
export async function GET(req: NextRequest) {
  const supabase = createUserClient(req);

  const { data, error } = await supabase
    .from("notes")
    .select("id, group_id, author_id, body, created_at, updated_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ notes: data });
}

// Body validation. `author_id` is intentionally NOT accepted from the client —
// the database stamps it from auth.uid() (see 0002_notes.sql).
const createNoteSchema = z.object({
  group_id: z.string().uuid(),
  body: z.string().min(1),
});

/**
 * POST /api/notes
 * Creates a note for one of the caller's groups.
 *
 * Input is validated with zod; bad input gets a 400. Tenant authorization is
 * NOT checked here — the RLS `with check` policy rejects an insert into a group
 * the caller doesn't belong to, and we surface that as a 403.
 */
export async function POST(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createNoteSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createUserClient(req);

  const { data, error } = await supabase
    .from("notes")
    .insert(parsed.data)
    .select("id, group_id, author_id, body, created_at, updated_at")
    .single();

  if (error) {
    // RLS violations come back as Postgres error 42501 (insufficient_privilege).
    const status = error.code === "42501" ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ note: data }, { status: 201 });
}
