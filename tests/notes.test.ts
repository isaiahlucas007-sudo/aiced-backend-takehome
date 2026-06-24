import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { asUser, asOwner, pool, ALICE, BOB, CAROL, ACME, GLOBEX } from "./helpers";

// Proves the `notes` feature is tenant-isolated by RLS.
//
// We seed one committed note per group as the DB owner (bypassing RLS), then
// assert what each user can see/do through `asUser` (RLS enforced, rolled back).
describe("notes (tenant isolation)", () => {
  beforeAll(async () => {
    await asOwner("delete from notes");
    await asOwner(
      `insert into notes (group_id, author_id, body) values
         ($1, $2, 'Acme private note'),
         ($3, $4, 'Globex private note')`,
      [ACME, ALICE, GLOBEX, BOB]
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
    expect(rows[0].body).toBe("Acme private note");
  });

  it("a user in both groups sees notes from both", async () => {
    const groupIds = await asUser(CAROL, async (q) =>
      (await q("select group_id from notes")).rows.map((r) => r.group_id)
    );

    expect(groupIds).toHaveLength(2);
    expect(new Set(groupIds)).toEqual(new Set([ACME, GLOBEX]));
  });

  it("a user cannot read another group's notes", async () => {
    const rows = await asUser(BOB, async (q) =>
      (await q("select group_id from notes where group_id = $1", [ACME])).rows
    );

    expect(rows).toHaveLength(0);
  });

  it("a user cannot insert a note into a group they don't belong to", async () => {
    await expect(
      asUser(ALICE, async (q) =>
        q("insert into notes (group_id, body) values ($1, $2)", [
          GLOBEX,
          "alice trying to write into globex",
        ])
      )
    ).rejects.toThrow(/row-level security/i);
  });

  it("a user can insert a note into their own group", async () => {
    const inserted = await asUser(ALICE, async (q) => {
      const res = await q(
        "insert into notes (group_id, body) values ($1, $2) returning group_id, author_id",
        [ACME, "alice writing into acme"]
      );
      return res.rows[0];
    });

    expect(inserted.group_id).toBe(ACME);
    // author_id is stamped by the DB default (auth.uid()), not sent by the client.
    expect(inserted.author_id).toBe(ALICE);
  });
});
