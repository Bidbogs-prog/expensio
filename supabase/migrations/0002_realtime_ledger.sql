-- ============================================================================
-- Expensio · Realtime for the shared household ledger
-- Streams expense/income changes to group co-members so the Family view updates
-- live. Realtime applies RLS per subscriber, so each member only receives
-- changes to rows they're allowed to read (own + co-members via the policies
-- added in 0001_family_groups.sql).
--
-- HOW TO APPLY: Supabase → SQL Editor → paste → Run. Idempotent.
-- ============================================================================

-- REPLICA IDENTITY FULL lets Realtime evaluate RLS against the *old* row on
-- UPDATE/DELETE, so co-member updates and deletes are delivered reliably.
alter table public.expenses replica identity full;
alter table public.income   replica identity full;

-- Add the tables to the Realtime publication (only if not already members).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'expenses'
  ) then
    alter publication supabase_realtime add table public.expenses;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'income'
  ) then
    alter publication supabase_realtime add table public.income;
  end if;
end $$;
