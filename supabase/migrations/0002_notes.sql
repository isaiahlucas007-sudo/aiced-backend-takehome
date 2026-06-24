-- ===========================================================================
-- Feature table: notes  (RLS enabled, tenant-scoped)
--
-- Unlike `documents`, `notes` is properly isolated by tenant: a user may only
-- read or create notes for groups they belong to (see `memberships`). The rule
-- is enforced in the RLS policy itself, not in application code.
--
-- Re-runnable: drops and recreates the table. `pnpm db:reset` runs 0001 first
-- (which also drops `notes`), then this file.
-- ===========================================================================

drop table if exists notes cascade;

create table notes (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references groups(id) on delete cascade,
  author_id  uuid not null default (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid references users(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert on notes to authenticated;

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table notes enable row level security;

-- A user may READ a note only if they belong to its group.
create policy "notes are visible to members of the group"
  on notes for select
  to authenticated
  using (
    group_id in (
      select group_id from memberships
      where user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid
    )
  );

-- A user may CREATE a note only for a group they belong to.
create policy "members can add notes to their groups"
  on notes for insert
  to authenticated
  with check (
    group_id in (
      select group_id from memberships
      where user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid
    )
  );
