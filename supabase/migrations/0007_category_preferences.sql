-- ============================================================================
-- Expensio · Persistent category preferences
--
-- HOW TO APPLY: open Supabase → SQL Editor → paste this whole file → Run.
-- It is idempotent (safe to run more than once).
--
-- WHAT CHANGES
--  user_settings gains two jsonb columns so "Manage categories" edits survive
--  reloads instead of living in component state:
--    custom_categories — user-created categories, e.g. {"expense":["coffee"]}
--    hidden_categories — deleted/hidden categories (incl. hidden defaults),
--                        same shape, keyed by kind ("expense" / "income").
-- ============================================================================

alter table public.user_settings
  add column if not exists custom_categories jsonb not null default '{}'::jsonb,
  add column if not exists hidden_categories jsonb not null default '{}'::jsonb;
