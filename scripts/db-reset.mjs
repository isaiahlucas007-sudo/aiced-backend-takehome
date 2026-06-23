// Applies every SQL file in supabase/migrations (in filename order) to DATABASE_URL.
// Re-runnable: 0001_init.sql drops and recreates the sandbox objects.
//
//   pnpm db:reset
//
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Copy .env.local.example to .env.local and fill it in.");
  process.exit(1);
}

const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
const files = (await readdir(migrationsDir))
  .filter((f) => f.endsWith(".sql") && !f.startsWith("."))
  .sort();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  for (const file of files) {
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    console.log(`applying ${file} ...`);
    await client.query(sql);
  }
  console.log(`done — applied ${files.length} migration(s).`);
} finally {
  await client.end();
}
