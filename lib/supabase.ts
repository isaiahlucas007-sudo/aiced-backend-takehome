import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * A per-request Supabase client that forwards the caller's JWT, so Row-Level
 * Security is enforced for this user.
 *
 * Send requests with an `Authorization: Bearer <access_token>` header.
 *
 * NOTE: this intentionally uses the public anon key + the caller's token.
 * Do NOT use the service-role key in request handlers — it bypasses RLS.
 */
export function createUserClient(req: NextRequest) {
  const authorization = req.headers.get("authorization") ?? "";
  return createClient(url, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
