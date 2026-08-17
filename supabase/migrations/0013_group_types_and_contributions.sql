-- ============================================================================
-- Expensio · Group types (family vs housemates) + contribution check-offs
--
-- HOW TO APPLY: open Supabase → SQL Editor → paste this whole file → Run.
-- It is idempotent (safe to run more than once). Requires 0001–0012 first.
--
-- WHAT CHANGES
--  1. groups gain a `type`:
--       'family'     → full sharing: expenses AND income (married/couple)
--       'housemates' → expenses only; income never enters the group
--     create_group() gains a p_type parameter (defaults to 'family').
--     (Renaming a group needs no schema change — the owner-update RLS policy
--      from 0001 already allows it; the UI just never offered it.)
--  2. New `expense_contributions`: housemates tick "I sent my share" on a
--     shared expense. One row per (expense, member); the row's existence is
--     the confirmation. Streams over Realtime so check-offs appear live.
-- ============================================================================

-- ── PART A · Group type ──────────────────────────────────────────────────────
alter table public.groups
  add column if not exists type text not null default 'family';

alter table public.groups drop constraint if exists groups_type_check;
alter table public.groups
  add constraint groups_type_check check (type in ('family', 'housemates'));

-- Replace the 1-arg RPC (avoids an ambiguous overload) with a typed version.
drop function if exists public.create_group(text);
create or replace function public.create_group(p_name text, p_type text default 'family')
returns public.groups language plpgsql security definer set search_path = public as $$
declare g public.groups;
begin
  if p_type not in ('family', 'housemates') then
    raise exception 'Unknown group type: %', p_type;
  end if;
  insert into public.groups (name, owner_id, type)
    values (trim(p_name), auth.uid(), p_type) returning * into g;
  insert into public.group_members (group_id, user_id, role) values (g.id, auth.uid(), 'owner');
  return g;
end;
$$;

grant execute on function public.create_group(text, text) to authenticated;

-- ── PART B · Contribution check-offs ─────────────────────────────────────────
create table if not exists public.expense_contributions (
  expense_id   bigint not null references public.expenses(id) on delete cascade,
  user_id      uuid   not null references public.profiles(id) on delete cascade,
  confirmed_at timestamptz not null default now(),
  primary key (expense_id, user_id)
);

alter table public.expense_contributions enable row level security;

-- The exists() runs under the caller's RLS on expenses, so it is true exactly
-- when the caller can see the (group-shared) expense.
drop policy if exists "group members read contributions" on public.expense_contributions;
create policy "group members read contributions"
  on public.expense_contributions for select to authenticated
  using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id and e.group_id is not null
    )
  );

drop policy if exists "members confirm own contribution" on public.expense_contributions;
create policy "members confirm own contribution"
  on public.expense_contributions for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.expenses e
      where e.id = expense_id and e.group_id is not null
    )
  );

drop policy if exists "members retract own contribution" on public.expense_contributions;
create policy "members retract own contribution"
  on public.expense_contributions for delete to authenticated
  using (user_id = auth.uid());

-- Realtime: check-offs stream to co-members like ledger rows do (0002).
alter table public.expense_contributions replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'expense_contributions'
  ) then
    alter publication supabase_realtime add table public.expense_contributions;
  end if;
end $$;
