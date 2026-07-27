-- ============================================================================
-- Expensio · Shared (family) savings goals
--
-- HOW TO APPLY: open Supabase → SQL Editor → paste this whole file → Run.
-- It is idempotent (safe to run more than once). Requires 0001–0004 first.
--
-- WHAT CHANGES
--  1. savings_goals / savings_contributions gain a nullable `group_id`:
--       group_id IS NULL      → personal goal (private to the owner)
--       group_id = <group id> → family goal (visible to that group's members)
--  2. Group members can read shared goals + contributions and contribute to
--     shared goals. Editing/deleting a goal stays creator-only; a contribution
--     can be deleted by whoever made it.
--  3. A contribution's scope is stamped server-side from its goal (trigger),
--     which also enforces that the caller may access that goal.
--  4. Both tables join the Realtime publication so the family savings view
--     updates live, like the shared ledger.
-- ============================================================================

-- ── PART A · group_id columns ─────────────────────────────────────────────────
alter table public.savings_goals
  add column if not exists group_id uuid references public.groups(id) on delete cascade;
alter table public.savings_contributions
  add column if not exists group_id uuid references public.groups(id) on delete cascade;

create index if not exists savings_goals_group_idx on public.savings_goals(group_id);
create index if not exists savings_contributions_group_idx on public.savings_contributions(group_id);

-- ── PART B · Goal membership guard ────────────────────────────────────────────
-- Reuses 0003's generic guard: you can't tag a goal to a group you're not in.
drop trigger if exists savings_goals_group_guard on public.savings_goals;
create trigger savings_goals_group_guard
  before insert or update on public.savings_goals
  for each row execute function public.enforce_tx_group_membership();

-- ── PART C · Contributions inherit their goal's scope ─────────────────────────
-- SECURITY DEFINER so the goal lookup bypasses RLS; the function itself is the
-- access check: personal goal → owner only, group goal → members only.
create or replace function public.stamp_savings_contribution_scope()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  goal record;
begin
  select user_id, group_id into goal
    from public.savings_goals where id = new.goal_id;
  if not found then
    raise exception 'Savings goal not found';
  end if;
  if goal.group_id is not null then
    if not public.is_group_member(goal.group_id, auth.uid()) then
      raise exception 'Not a member of this goal''s group';
    end if;
  elsif goal.user_id <> auth.uid() then
    raise exception 'Not your savings goal';
  end if;
  new.group_id := goal.group_id;
  return new;
end;
$$;

drop trigger if exists savings_contributions_scope on public.savings_contributions;
create trigger savings_contributions_scope
  before insert or update on public.savings_contributions
  for each row execute function public.stamp_savings_contribution_scope();

-- ── PART D · RLS: open shared rows to group members ───────────────────────────
-- Goals: read own + shared; create own or into a group you belong to.
drop policy if exists "owner reads goals" on public.savings_goals;
create policy "owner reads goals"
  on public.savings_goals for select to authenticated
  using (
    user_id = auth.uid()
    or (group_id is not null and public.is_group_member(group_id, auth.uid()))
  );

drop policy if exists "owner creates goals" on public.savings_goals;
create policy "owner creates goals"
  on public.savings_goals for insert to authenticated
  with check (
    user_id = auth.uid()
    and (group_id is null or public.is_group_member(group_id, auth.uid()))
  );

-- Update/delete policies from 0004 stay creator-only — no change needed.

-- Contributions: read own + those on shared goals of your groups.
drop policy if exists "owner reads contributions" on public.savings_contributions;
create policy "owner reads contributions"
  on public.savings_contributions for select to authenticated
  using (
    user_id = auth.uid()
    or (group_id is not null and public.is_group_member(group_id, auth.uid()))
  );

-- Create: the scope trigger (PART C) is the real access guard, so the policy
-- only pins the author. Replaces 0004's own-goal-only check.
drop policy if exists "owner creates contributions" on public.savings_contributions;
create policy "owner creates contributions"
  on public.savings_contributions for insert to authenticated
  with check (user_id = auth.uid());

-- Delete stays "own contributions only" from 0004 — no change needed.

-- ── PART E · Realtime ─────────────────────────────────────────────────────────
alter table public.savings_goals         replica identity full;
alter table public.savings_contributions replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'savings_goals'
  ) then
    alter publication supabase_realtime add table public.savings_goals;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'savings_contributions'
  ) then
    alter publication supabase_realtime add table public.savings_contributions;
  end if;
end $$;
