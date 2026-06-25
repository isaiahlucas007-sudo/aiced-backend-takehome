# NOTES

## RLS approach
Tenant isolation lives entirely in the `notes` RLS policies, not in app code.
The SELECT policy uses an `exists` subquery against `memberships` keyed on
`auth.uid()`, so a row is visible only to members of its `group_id`. The INSERT
policy's `with check` repeats that membership test and also pins
`author_id = auth.uid()`, so a caller can neither write into a group they don't
belong to nor forge another user's authorship. I mirrored the `documents`
pattern, including `grant select, insert on notes to authenticated` — without the
grant, RLS-correct queries still fail with "permission denied". The API route
uses the anon key plus the caller's JWT (`createUserClient`), so the database is
the single source of truth; `author_id` is taken from the session, never the
request body. POST validates input with zod (400 on bad input, 401 when
unauthenticated, 403 when RLS rejects the group). The test seeds committed notes
for both tenants with `asOwner` and asserts isolation with `asUser` in both
directions, plus the authorship-forgery case.

## How I used AI
I used Cursor (Composer/Agent mode with Claude) to scaffold the migration, API
route, and test file from the take-home prompt and existing repo conventions
(`0001_init.sql`, `documents/route.ts`, `helpers.ts`). I reviewed the generated
SQL and TypeScript against those patterns before committing in four phases. I
could not run `pnpm db:reset` or `pnpm test` in this environment because
`.env.local` has no `DATABASE_URL` filled in and Docker/local Supabase is not
available here — those commands should be run locally after adding Supabase
credentials.
