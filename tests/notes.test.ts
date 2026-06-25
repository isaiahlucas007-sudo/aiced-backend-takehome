import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { asUser, asOwner, pool, ALICE, BOB, CAROL, ACME, GLOBEX } from "./helpers";

// Proves tenant isolation for the `notes` feature.
// Fixtures are committed with asOwner so both groups have a note; assertions run
// with asUser (RLS enforced, transaction rolled back after each call).
describe("notes — tenant isolation", () => {
  beforeAll(async () => {
    await asOwner("delete from notes");
    await asOwner(
      "insert into notes (group_id, author_id, body) values ($1,$2,$3),($4,$5,$6)",
      [ACME, ALICE, "Acme note", GLOBEX, BOB, "Globex note"]
    );
  });

  afterAll(async () => {
    await asOwner("delete from notes");
    await pool.end();
  });

  it("a member sees only their own group's notes", async () => {
    const rows = await asUser(ALICE, async (q) =>
      (await q("select group_id, body from notes")).rows
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].group_id).toBe(ACME);
    expect(rows.some((r) => r.group_id === GLOBEX)).toBe(false);
  });

  it("a user in both groups sees both groups' notes", async () => {
    const rows = await asUser(CAROL, async (q) =>
      (await q("select group_id from notes")).rows
    );
    expect([...new Set(rows.map((r) => r.group_id))].sort()).toEqual(
      [ACME, GLOBEX].sort()
    );
  });

  it("a user cannot read another group's notes", async () => {
    const rows = await asUser(BOB, async (q) =>
      (await q("select group_id from notes where group_id = $1", [ACME])).rows
    );
    expect(rows).toHaveLength(0);
  });

  it("a member can insert a note into their own group", async () => {
    const rows = await asUser(ALICE, async (q) =>
      (await q(
        "insert into notes (group_id, author_id, body) values ($1,$2,$3) returning id",
        [ACME, ALICE, "Alice's new note"]
      )).rows
    );
    expect(rows).toHaveLength(1);
  });

  it("a user cannot insert a note into a group they don't belong to", async () => {
    await expect(
      asUser(ALICE, async (q) =>
        q("insert into notes (group_id, author_id, body) values ($1,$2,$3)", [
          GLOBEX, ALICE, "sneaky cross-tenant note",
        ])
      )
    ).rejects.toThrow();
  });

  it("a user cannot forge authorship as someone else", async () => {
    await expect(
      asUser(ALICE, async (q) =>
        q("insert into notes (group_id, author_id, body) values ($1,$2,$3)", [
          ACME, BOB, "forged author",
        ])
      )
    ).rejects.toThrow();
  });
});
