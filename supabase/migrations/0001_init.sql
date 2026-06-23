-- ===========================================================================
-- Multi-tenant sandbox for the backend take-home.
--
--   Reference tables : groups, users, memberships  (no RLS in this sandbox)
--   Feature table    : documents                   (RLS enabled)
--
-- Users belong to one or more `groups` (tenants) via `memberships`.
-- This file is re-runnable: it drops and recreates the sandbox objects.
-- ===========================================================================

create extension if not exists pgcrypto;

drop table if exists notes cascade;        -- you will create this in 0002_notes.sql
drop table if exists documents cascade;
drop table if exists memberships cascade;
drop table if exists users cascade;
drop table if exists groups cascade;

create table groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

create table users (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  created_at timestamptz not null default now()
);

create table memberships (
  user_id  uuid not null references users(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  primary key (user_id, group_id)
);

create table documents (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references groups(id) on delete cascade,
  author_id  uuid not null references users(id) on delete cascade,
  title      text not null,
  created_at timestamptz not null default now()
);

-- Reference tables are readable by any signed-in user in this sandbox.
grant select on groups, users, memberships to authenticated;
grant select, insert on documents to authenticated;

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table documents enable row level security;

-- Existing access policy for `documents`. Follow this same pattern for `notes`.
create policy "documents are visible to signed-in users"
  on documents for select
  to authenticated
  using (true);

create policy "signed-in users can add documents"
  on documents for insert
  to authenticated
  with check (true);

-- ---------------------------------------------------------------------------
-- Seed data (two tenants; carol belongs to both)
-- ---------------------------------------------------------------------------
insert into groups (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Acme'),
  ('22222222-2222-2222-2222-222222222222', 'Globex');

insert into users (id, email) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'alice@acme.test'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bob@globex.test'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'carol@both.test');

insert into memberships (user_id, group_id) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111'), -- alice -> Acme
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222'), -- bob   -> Globex
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111'), -- carol -> Acme
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222'); -- carol -> Globex

insert into documents (group_id, author_id, title) values
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Acme welcome doc'),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Globex welcome doc');
