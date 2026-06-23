import { NextRequest, NextResponse } from "next/server";
import { createUserClient } from "@/lib/supabase";

/**
 * GET /api/documents
 * Returns the documents the caller is allowed to see.
 *
 * This uses the caller's session (anon key + their JWT), so whatever the
 * `documents` RLS policy allows is what comes back. The route does NOT filter
 * by tenant in application code — the database is the source of truth.
 *
 * Use this same client pattern for your `notes` route.
 */
export async function GET(req: NextRequest) {
  const supabase = createUserClient(req);

  const { data, error } = await supabase
    .from("documents")
    .select("id, group_id, author_id, title, created_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ documents: data });
}
