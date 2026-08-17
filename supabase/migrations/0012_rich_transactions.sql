-- ============================================================================
-- Expensio · Richer transaction model: payee, notes, tags, receipts, refunds
--
-- HOW TO APPLY: open Supabase → SQL Editor → paste this whole file → Run.
-- It is idempotent (safe to run more than once). Requires 0001–0011 first.
--
-- WHAT CHANGES
--  1. expenses/income gain payee (merchant), note, tags (text[]) and
--     receipt_path (a path inside the private `receipts` storage bucket).
--  2. Negative amounts become legal: a negative expense is a refund, a
--     negative income is a correction. Any old CHECK constraints forcing
--     amount > 0 are dropped.
--  3. Private `receipts` storage bucket with per-user folder RLS
--     (uploads land at <user_id>/<uuid>.<ext>).
-- ============================================================================

-- ── PART A · New columns ─────────────────────────────────────────────────────
alter table public.expenses
  add column if not exists payee        text,
  add column if not exists note         text,
  add column if not exists tags         text[] not null default '{}',
  add column if not exists receipt_path text;

alter table public.income
  add column if not exists payee        text,
  add column if not exists note         text,
  add column if not exists tags         text[] not null default '{}',
  add column if not exists receipt_path text;

-- ── PART B · Allow refunds (negative amounts) ────────────────────────────────
-- Drop any CHECK constraint on expenses/income that mentions amount, whatever
-- it was named when the tables were first created.
do $$
declare r record;
begin
  for r in
    select conrelid::regclass::text as tbl, conname
    from pg_constraint
    where contype = 'c'
      and conrelid in ('public.expenses'::regclass, 'public.income'::regclass)
      and pg_get_constraintdef(oid) ilike '%amount%'
  loop
    execute format('alter table %s drop constraint %I', r.tbl, r.conname);
  end loop;
end $$;

-- Zero stays meaningless — a row must move money in one direction or the other.
alter table public.expenses drop constraint if exists expenses_amount_nonzero;
alter table public.expenses add constraint expenses_amount_nonzero check (amount <> 0);
alter table public.income drop constraint if exists income_amount_nonzero;
alter table public.income add constraint income_amount_nonzero check (amount <> 0);

-- ── PART C · Receipts bucket + per-user folder policies ──────────────────────
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- Owner-only, keyed on the first folder segment being the caller's uid.
drop policy if exists "users manage own receipts" on storage.objects;
create policy "users manage own receipts"
  on storage.objects for all to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
