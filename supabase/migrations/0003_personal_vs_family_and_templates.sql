-- ============================================================================
-- Expensio · Separate personal vs family budgets  +  category templates
--
-- HOW TO APPLY: open Supabase → SQL Editor → paste this whole file → Run.
-- It is idempotent (safe to run more than once). Requires 0001 + 0002 first.
--
-- WHAT CHANGES
--  1. expenses/income gain a nullable `group_id`:
--       group_id IS NULL      → personal transaction (private to the owner)
--       group_id = <group id> → family transaction (visible to that group)
--  2. The old "co-members read ALL your rows" SELECT policy from 0001 is
--     REPLACED with a group-scoped one, so personal rows are private again and
--     only rows explicitly tagged to a group are shared.
--  3. A guard trigger blocks tagging a row to a group you don't belong to.
--  4. New `budget_templates` table stores reusable sets of fixed
--     expense/income line items for one-tap monthly entry (personal or shared).
-- ============================================================================

-- ── PART A · group_id on transactions ─────────────────────────────────────────
alter table public.expenses
  add column if not exists group_id uuid references public.groups(id) on delete cascade;
alter table public.income
  add column if not exists group_id uuid references public.groups(id) on delete cascade;

create index if not exists expenses_group_id_idx on public.expenses(group_id);
create index if not exists income_group_id_idx   on public.income(group_id);

-- ── PART B · Membership guard (can't tag a row to a group you're not in) ──────
create or replace function public.enforce_tx_group_membership()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.group_id is not null
     and not public.is_group_member(new.group_id, auth.uid()) then
    raise exception 'Not a member of the target group';
  end if;
  return new;
end;
$$;

drop trigger if exists expenses_group_guard on public.expenses;
create trigger expenses_group_guard
  before insert or update on public.expenses
  for each row execute function public.enforce_tx_group_membership();

drop trigger if exists income_group_guard on public.income;
create trigger income_group_guard
  before insert or update on public.income
  for each row execute function public.enforce_tx_group_membership();

-- ── PART C · Replace the leaky co-member SELECT policies ──────────────────────
-- 0001 shared EVERY row of a co-member (their personal spending too). Now only
-- rows explicitly tagged to a shared group are visible to that group's members.
drop policy if exists "group co-members read expenses" on public.expenses;
create policy "group members read group expenses"
  on public.expenses for select to authenticated
  using (group_id is not null and public.is_group_member(group_id, auth.uid()));

drop policy if exists "group co-members read income" on public.income;
create policy "group members read group income"
  on public.income for select to authenticated
  using (group_id is not null and public.is_group_member(group_id, auth.uid()));

-- ── PART D · Category / budget templates ──────────────────────────────────────
-- items shape: [{ "category": text, "name": text, "amount": number }, ...]
create table if not exists public.budget_templates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  group_id   uuid references public.groups(id) on delete cascade,  -- null = personal
  kind       text not null check (kind in ('expense','income')),
  name       text not null,
  items      jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

create index if not exists budget_templates_scope_idx
  on public.budget_templates(user_id, group_id, kind);

alter table public.budget_templates enable row level security;

-- Read: your own templates, plus shared templates of groups you belong to.
drop policy if exists "read own and group templates" on public.budget_templates;
create policy "read own and group templates"
  on public.budget_templates for select to authenticated
  using (
    user_id = auth.uid()
    or (group_id is not null and public.is_group_member(group_id, auth.uid()))
  );

-- Create: personal templates, or shared templates for a group you belong to.
drop policy if exists "create own or group templates" on public.budget_templates;
create policy "create own or group templates"
  on public.budget_templates for insert to authenticated
  with check (
    user_id = auth.uid()
    and (group_id is null or public.is_group_member(group_id, auth.uid()))
  );

-- Update / delete: only the creator.
drop policy if exists "creator updates template" on public.budget_templates;
create policy "creator updates template"
  on public.budget_templates for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "creator deletes template" on public.budget_templates;
create policy "creator deletes template"
  on public.budget_templates for delete to authenticated
  using (user_id = auth.uid());
