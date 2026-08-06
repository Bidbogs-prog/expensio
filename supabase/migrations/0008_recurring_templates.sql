-- ============================================================================
-- Expensio · Auto-applying (recurring) templates via pg_cron
--
-- HOW TO APPLY: open Supabase → SQL Editor → paste this whole file → Run.
-- It is idempotent (safe to run more than once). Requires 0001–0007 first.
-- NOTE: pg_cron must be available on the project (Database → Extensions).
--
-- WHAT CHANGES
--  1. budget_templates gains `auto_apply` + `last_applied` ('YYYY-MM').
--  2. apply_due_templates() inserts every auto_apply template's items as
--     transactions dated the 1st of the current month, once per month.
--  3. A daily pg_cron job (00:30 UTC) runs it — the first run of a new month
--     applies the templates; later runs are no-ops. Daily scheduling gives
--     catch-up if the 1st is ever missed.
--  4. The transaction group-membership guard learns to skip when auth.uid()
--     is NULL (cron/definer context) — client inserts are still guarded.
-- ============================================================================

-- ── PART A · Columns ─────────────────────────────────────────────────────────
alter table public.budget_templates
  add column if not exists auto_apply boolean not null default false,
  add column if not exists last_applied text;  -- 'YYYY-MM' of the last auto-run

-- ── PART B · Guard trigger allows cron inserts ───────────────────────────────
-- auth.uid() is NULL only in service/cron contexts, which bypass RLS anyway;
-- every client request carries a uid, so the client-side guard is unchanged.
create or replace function public.enforce_tx_group_membership()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.group_id is not null
     and auth.uid() is not null
     and not public.is_group_member(new.group_id, auth.uid()) then
    raise exception 'Not a member of the target group';
  end if;
  return new;
end;
$$;

-- ── PART C · The monthly applier ─────────────────────────────────────────────
create or replace function public.apply_due_templates()
returns integer language plpgsql security definer set search_path = public as $$
declare
  t record;
  item jsonb;
  cur_month text := to_char(now(), 'YYYY-MM');
  first_of_month date := date_trunc('month', now())::date;
  applied integer := 0;
begin
  for t in
    select * from public.budget_templates
    where auto_apply
      and (last_applied is null or last_applied < cur_month)
  loop
    -- Skip group templates whose owner has since left the group.
    if t.group_id is not null
       and not public.is_group_member(t.group_id, t.user_id) then
      continue;
    end if;

    for item in select * from jsonb_array_elements(t.items)
    loop
      if t.kind = 'expense' then
        insert into public.expenses (user_id, group_id, category, name, amount, date)
        values (t.user_id, t.group_id, item->>'category', item->>'name',
                (item->>'amount')::numeric(12,2), first_of_month);
      else
        insert into public.income (user_id, group_id, category, name, amount, date)
        values (t.user_id, t.group_id, item->>'category', item->>'name',
                (item->>'amount')::numeric(12,2), first_of_month);
      end if;
    end loop;

    update public.budget_templates set last_applied = cur_month where id = t.id;
    applied := applied + 1;
  end loop;

  return applied;
end;
$$;

-- Only the cron/service context should call this; revoke from clients.
revoke execute on function public.apply_due_templates() from anon, authenticated;

-- ── PART D · Schedule ────────────────────────────────────────────────────────
create extension if not exists pg_cron;

do $$
begin
  perform cron.unschedule('expensio-apply-recurring-templates');
exception when others then
  null; -- job did not exist yet
end $$;

select cron.schedule(
  'expensio-apply-recurring-templates',
  '30 0 * * *',
  $$select public.apply_due_templates()$$
);
