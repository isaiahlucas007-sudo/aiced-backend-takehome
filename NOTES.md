# NOTES

## RLS approach

Tenant isolation for `notes` lives entirely in the database. The table has RLS
enabled with two policies scoped to the `authenticated` role. Both the `SELECT`
`using` clause and the `INSERT` `with check` clause test the same condition:
`group_id in (select group_id from memberships where user_id = auth.uid())`. So a
user can only read notes for groups they belong to, and can only insert a note
into a group they belong to — anything else is rejected by Postgres itself, not
by application code. `auth.uid()` reads the caller's JWT `sub` claim, which the
API forwards via the anon key (never the service-role key, which would bypass
RLS). The `author_id` column defaults to `auth.uid()`, so the server stamps the
author and the client can't spoof it; the API only accepts `group_id` and `body`,
validated with `zod` (bad input returns a 400, and an RLS-blocked insert surfaces
as a 403). The route mirrors the existing `documents` client pattern and does no
tenant filtering of its own, keeping the database the single source of truth. The
test suite seeds one note per tenant as the DB owner, then uses the `asUser`
harness to prove Alice sees only Acme's notes, Carol (in both groups) sees both,
and Alice cannot read or insert into Globex.

## How I used AI

I used Claude Code (Opus) as a pair-programmer: it read the existing migration,
`documents` route, and test harness, explained how the `asUser`/`asOwner` helpers
and `auth.uid()` interact, and drafted the migration, API route, and tests in the
same style as the existing code. I reviewed every line, confirmed the RLS policies
against the seeded membership data, and ran `pnpm db:reset` and `pnpm test` to
verify tenant isolation end to end.
