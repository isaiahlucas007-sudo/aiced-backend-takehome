import pg from "pg";

// Shared connection pool (reads DATABASE_URL, loaded by vitest.config.ts).
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Seeded IDs — see supabase/migrations/0001_init.sql
export const ACME = "11111111-1111-1111-1111-111111111111";
export const GLOBEX = "22222222-2222-2222-2222-222222222222";
export const ALICE = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"; // Acme
export const BOB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"; // Globex
export const CAROL = "cccccccc-cccc-cccc-cccc-cccccccccccc"; // Acme + Globex

type Query = (text: string, params?: unknown[]) => Promise<pg.QueryResult>;

/**
 * Run a query as the database owner — RLS is NOT applied.
 *
 * Use this in beforeAll/afterAll to seed or clean up committed fixtures.
 * (`asUser` rolls back after each call, so it can't create rows that a later
 * query in another `asUser` block would be able to see.)
 */
export function asOwner(text: string, params?: unknown[]): Promise<pg.QueryResult> {
  return pool.query(text, params);
}

/**
 * Run queries as if the request came from `userId`.
 *
 * It switches to the `authenticated` role and sets the JWT claims that
 * Supabase's `auth.uid()` reads — so RLS is enforced exactly as it would be for
 * a real signed-in user. Everything runs inside a transaction that is rolled
 * back afterward, so tests don't leak state into each other.
 */
export async function asUser<T>(userId: string, fn: (q: Query) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: userId, role: "authenticated" }),
    ]);
    await client.query("set local role authenticated");
    const q: Query = (text, params) => client.query(text, params);
    return await fn(q);
  } finally {
    await client.query("rollback").catch(() => {});
    client.release();
  }
}
