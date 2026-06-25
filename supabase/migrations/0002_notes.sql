-- ===========================================================================
-- 0002_notes.sql — tenant-scoped `notes` feature
--
-- A note belongs to exactly one group (tenant). A user may read and create
-- notes ONLY for groups they belong to (via `memberships`). Isolation is
-- enforced in the RLS policies below, never in application code.
--
-- Re-runnable: 0001 already drops `notes`, and this file drops it again, so
-- `pnpm db:reset` (0001 then 0002) applies cleanly every time.
-- ===========================================================================

drop table if exists notes cascade;

create table notes (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references groups(id) on delete cascade,
  author_id  uuid not null references users(id)  on delete cascade,
  body       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notes_group_id_idx on notes (group_id);

-- Same grant pattern as `documents`: the role needs table privileges IN ADDITION
-- to RLS policies, or every query fails with "permission denied for table notes".
grant select, insert on notes to authenticated;

-- Keep updated_at fresh (ready for a future PATCH endpoint).
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger notes_set_updated_at
  before update on notes
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-Level Security — the heart of tenant isolation.
-- ---------------------------------------------------------------------------
alter table notes enable row level security;

-- READ: you can see a note only if you belong to its group.
create policy "notes are visible to members of their group"
  on notes for select
  to authenticated
  using (
    exists (
      select 1 from memberships m
      where m.group_id = notes.group_id
        and m.user_id  = auth.uid()
    )
  );

-- WRITE: you can insert a note only into a group you belong to, and only as
-- yourself — author_id is pinned to the caller, so authorship can't be forged.
create policy "members can add notes to their group"
  on notes for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from memberships m
      where m.group_id = notes.group_id
        and m.user_id  = auth.uid()
    )
  );
