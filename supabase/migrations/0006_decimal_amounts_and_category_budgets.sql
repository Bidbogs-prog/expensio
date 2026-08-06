-- ============================================================================
-- Expensio · Decimal amounts + per-category budget limits
--
-- HOW TO APPLY: open Supabase → SQL Editor → paste this whole file → Run.
-- It is idempotent (safe to run more than once). Requires 0001–0005 first.
--
-- WHAT CHANGES
--  1. expenses.amount / income.amount become numeric(12,2) so cents survive
--     (they may have been created as integer columns originally).
--  2. New `category_budgets` table: a monthly spending limit per expense
--     category, personal (group_id NULL) or shared with a family group.
--     Group budgets are editable by every member; personal by the owner.
-- ============================================================================

-- ── PART A · Amounts gain 2 decimal places ───────────────────────────────────
alter table public.expenses
  alter column amount type numeric(12,2) using amount::numeric(12,2);
alter table public.income
  alter column amount type numeric(12,2) using amount::numeric(12,2);

-- ── PART B · Per-category monthly budget limits ──────────────────────────────
create table if not exists public.category_budgets (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  group_id      uuid references public.groups(id) on delete cascade,  -- null = personal
  category      text not null,
  monthly_limit numeric(12,2) not null check (monthly_limit > 0),
  created_at    timestamptz default now()
);

-- One limit per category per scope. Personal and group scopes get their own
-- partial unique indexes because group budgets are shared across members.
create unique index if not exists category_budgets_personal_uniq
  on public.category_budgets(user_id, category) where group_id is null;
create unique index if not exists category_budgets_group_uniq
  on public.category_budgets(group_id, category) where group_id is not null;

alter table public.category_budgets enable row level security;

-- Read: your own personal budgets, plus budgets of groups you belong to.
drop policy if exists "read own and group budgets" on public.category_budgets;
create policy "read own and group budgets"
  on public.category_budgets for select to authenticated
  using (
    (group_id is null and user_id = auth.uid())
    or (group_id is not null and public.is_group_member(group_id, auth.uid()))
  );

-- Create: personal budgets, or budgets for a group you belong to.
drop policy if exists "create own or group budgets" on public.category_budgets;
create policy "create own or group budgets"
  on public.category_budgets for insert to authenticated
  with check (
    user_id = auth.uid()
    and (group_id is null or public.is_group_member(group_id, auth.uid()))
  );

-- Update / delete: owner for personal budgets; any member for group budgets,
-- so a household can adjust its shared limits without waiting on the creator.
drop policy if exists "edit own or group budgets" on public.category_budgets;
create policy "edit own or group budgets"
  on public.category_budgets for update to authenticated
  using (
    (group_id is null and user_id = auth.uid())
    or (group_id is not null and public.is_group_member(group_id, auth.uid()))
  )
  with check (
    (group_id is null and user_id = auth.uid())
    or (group_id is not null and public.is_group_member(group_id, auth.uid()))
  );

drop policy if exists "delete own or group budgets" on public.category_budgets;
create policy "delete own or group budgets"
  on public.category_budgets for delete to authenticated
  using (
    (group_id is null and user_id = auth.uid())
    or (group_id is not null and public.is_group_member(group_id, auth.uid()))
  );
