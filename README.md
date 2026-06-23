# Backend Developer Take-Home — Multi-Tenant Notes (~2 hours)

Thanks for applying! This is a small, focused exercise that mirrors the work
you'd actually do with us: a **Next.js + Supabase (Postgres)** backend with
**multi-tenant Row-Level Security (RLS)**.

It should take about **2 hours**. Please don't sink a weekend into it — we're
looking at how you *think*, not how much time you can spend.

> ⏱️ **No hard deadline — just send it back as soon as you're done.** It's about
> a 2-hour task; sooner is better, but we care about the work, not the clock.

## The setup

A tiny multi-tenant app. Users belong to one or more **groups** (tenants) via the
`memberships` table. The database already has a `documents` feature. **Skim the
existing migration and code before you start**, and build in the same spirit as
what's there.

## Your task — add a tenant-scoped `notes` feature

1. **Migration** — add `supabase/migrations/0002_notes.sql` creating a `notes`
   table (`id`, `group_id`, `author_id`, `body`, `created_at`, `updated_at`) with
   **RLS enabled**.
2. **RLS policy** — a user may read and create notes **only for groups they
   belong to** (see `memberships`). Enforce this **in the policy itself**, not in
   application code.
3. **API route** — `app/api/notes/route.ts` with:
   - `GET` → the notes the caller is allowed to see
   - `POST` → create a note, with **input validation** (we use `zod`) and a
     sensible `4xx` on bad input
   - Use the caller's session so RLS applies — copy the client pattern in
     `app/api/documents/route.ts`.
4. **A test that proves tenant isolation** — in `tests/notes.test.ts`: a user in
   one group must **not** be able to read or insert another group's notes. See
   `tests/documents.example.test.ts` for how to use the test harness.
5. **`NOTES.md`** — 5–10 sentences: your RLS approach, and **how you used AI**
   (which tools, for what).

## Rules

- **AI tools are welcome** — use whatever you'd use on the job. Just tell us how,
  in `NOTES.md`.
- **Don't weaken or disable RLS** to make something pass.
- **Don't commit secrets.** `.env.local` is gitignored — keep it that way.
- Use the seeded data; you don't need any real data.
- Timebox to ~2 hours.

## What we're evaluating

Correct multi-tenant RLS and tenant isolation · a clean migration · input
validation and sensible errors · a meaningful test · code that fits the repo · a
clear PR description and `NOTES.md` · good security instincts.

## Running it locally

You need a Postgres with RLS. Pick whichever is easier — both are documented in
`.env.local.example`:

- **Option A (no Docker):** create a free project at https://supabase.com and
  copy your API + database values into `.env.local`.
- **Option B:** local Supabase via the Supabase CLI (`supabase start`).

Then:

```bash
pnpm install      # or npm install
cp .env.local.example .env.local   # then fill it in
pnpm db:reset     # applies migrations + seed to your DATABASE_URL
pnpm test         # runs the test suite
pnpm dev          # optional: app at http://localhost:3000
```

`pnpm db:reset` re-runs all migrations from scratch, so run it again after you
add `0002_notes.sql`.

## How to submit

1. Click **“Use this template”** at the top of this repo to create **your own
   copy** (private is fine — just add us as a collaborator).
2. Do your work on a branch and open a **pull request in your copy**.
3. Reply to our email with the **link to your repo / PR**.

Questions are welcome at any point. Have fun!
