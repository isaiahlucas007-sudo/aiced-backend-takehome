import { describe, it, expect, afterAll } from "vitest";
import { asUser, pool, ALICE } from "./helpers";

// Example showing how to use the `asUser` harness. You can delete this file —
// it's here to demonstrate the pattern for your own notes.test.ts.
//
// (Note: `documents` is intentionally NOT isolated by tenant in this sandbox.
//  Your `notes` feature must be.)
describe("documents (example: how to use the harness)", () => {
  it("runs a query as a signed-in user", async () => {
    const rows = await asUser(ALICE, async (q) => (await q("select id, title from documents")).rows);
    expect(Array.isArray(rows)).toBe(true);
  });

  afterAll(async () => {
    await pool.end();
  });
});
