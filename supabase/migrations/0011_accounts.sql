-- ============================================================================
-- Expensio · Accounts model (checking / card / cash), transfers, reconciliation
--
-- HOW TO APPLY: open Supabase → SQL Editor → paste this whole file → Run.
-- It is idempotent (safe to run more than once). Requires 0001–0010 first.
--
-- WHAT CHANGES
--  1. New `accounts` table: where money physically lives. Personal-only —
--     family budgets share *transactions*, but an account (a wallet, a CIH
--     card) always belongs to one person. `sync_source` is the SyncSource
--     abstraction from the roadmap: 'manual' today; future Bank Al-Maghrib
--     open-banking adapters (or statement importers) plug in as new values
--     without schema changes.
--  2. New `account_transfers`: money moved between two of your accounts
--     (ATM withdrawal card→cash, top-ups…). Not income, not an expense.
--  3. New `account_adjustments`: signed corrections created by reconciliation
--     ("the app says 4 210 MAD, my pocket says 4 000").
--  4. expenses/income gain a nullable `account_id` so every ledger row can say
--     which account it hit. NULL = untracked (all pre-existing rows).
-- ============================================================================

-- ── PART A · accounts ────────────────────────────────────────────────────────
create table if not exists public.accounts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  type            text not null check (type in ('checking','card','cash','other')),
  -- Balance the account started with when added; can be negative (card debt).
  opening_balance numeric(12,2) not null default 0,
  -- SyncSource abstraction: how rows get into this account. 'manual' for now;
  -- future adapters (statement import, BAM open banking) add their own values.
  sync_source     text not null default 'manual',
  archived        boolean not null default false,
  -- Stamped whenever the user reconciles against the real-world balance.
  reconciled_at   timestamptz,
  created_at      timestamptz default now()
);

create index if not exists accounts_user_id_idx on public.accounts(user_id);

alter table public.accounts enable row level security;

drop policy if exists "users manage own accounts" on public.accounts;
create policy "users manage own accounts"
  on public.accounts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── PART B · transfers between own accounts ──────────────────────────────────
create table if not exists public.account_transfers (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  from_account_id uuid not null references public.accounts(id) on delete cascade,
  to_account_id   uuid not null references public.accounts(id) on delete cascade,
  amount          numeric(12,2) not null check (amount > 0),
  date            date not null,
  note            text,
  created_at      timestamptz default now(),
  check (from_account_id <> to_account_id)
);

create index if not exists account_transfers_user_id_idx
  on public.account_transfers(user_id);

alter table public.account_transfers enable row level security;

-- The exists() subqueries run under the caller's RLS, and accounts are
-- owner-only readable — so they double as "both endpoints are YOUR accounts".
drop policy if exists "users manage own transfers" on public.account_transfers;
create policy "users manage own transfers"
  on public.account_transfers for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.accounts a where a.id = from_account_id)
    and exists (select 1 from public.accounts a where a.id = to_account_id)
  );

-- ── PART C · reconciliation adjustments ──────────────────────────────────────
create table if not exists public.account_adjustments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  -- Signed: positive = app under-counted, negative = app over-counted.
  amount     numeric(12,2) not null check (amount <> 0),
  date       date not null,
  note       text,
  created_at timestamptz default now()
);

create index if not exists account_adjustments_account_id_idx
  on public.account_adjustments(account_id);

alter table public.account_adjustments enable row level security;

drop policy if exists "users manage own adjustments" on public.account_adjustments;
create policy "users manage own adjustments"
  on public.account_adjustments for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.accounts a where a.id = account_id)
  );

-- ── PART D · account_id on the ledger ────────────────────────────────────────
alter table public.expenses
  add column if not exists account_id uuid references public.accounts(id) on delete set null;
alter table public.income
  add column if not exists account_id uuid references public.accounts(id) on delete set null;

create index if not exists expenses_account_id_idx on public.expenses(account_id);
create index if not exists income_account_id_idx   on public.income(account_id);

-- Guard: a ledger row may only point at an account owned by the row's owner
-- (mirrors enforce_tx_group_membership from 0003).
create or replace function public.enforce_tx_account_ownership()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.account_id is not null
     and not exists (
       select 1 from public.accounts a
       where a.id = new.account_id and a.user_id = new.user_id
     ) then
    raise exception 'Account does not belong to the transaction owner';
  end if;
  return new;
end;
$$;

drop trigger if exists expenses_account_guard on public.expenses;
create trigger expenses_account_guard
  before insert or update on public.expenses
  for each row execute function public.enforce_tx_account_ownership();

drop trigger if exists income_account_guard on public.income;
create trigger income_account_guard
  before insert or update on public.income
  for each row execute function public.enforce_tx_account_ownership();
