import { describe, it } from "vitest";
// import { afterAll, beforeAll, expect } from "vitest";
// import { asUser, asOwner, pool, ALICE, BOB, ACME, GLOBEX } from "./helpers";

// TODO: prove your `notes` feature is tenant-isolated.
//
// Two things to know about the harness (see tests/helpers.ts):
//   - asUser(userId, async (q) => { ... }) runs as a signed-in user with RLS
//     enforced, then ROLLS BACK — great for assertions, but it can't leave data
//     behind for another query to see.
//   - asOwner(sql, params) runs as the DB owner and BYPASSES RLS. Use it in
//     beforeAll to seed committed notes for BOTH groups, and in afterAll to
//     clean up (await asOwner("delete from notes")).
//
// At minimum, prove a user can see/insert their OWN group's notes but NOT
// another group's. Seeded users: ALICE = Acme, BOB = Globex, CAROL = both.
// Close the pool in afterAll: await pool.end().

describe("notes", () => {
  it.todo("a member sees only their own group's notes");
  it.todo("a user cannot insert a note into a group they don't belong to");
});
