-- ============================================================================
-- Expensio · Settle-up is opt-in per group
--
-- HOW TO APPLY: open Supabase → SQL Editor → paste this whole file → Run.
-- It is idempotent (safe to run more than once). Requires 0001 first.
--
-- WHAT CHANGES
--  groups gains `settle_up boolean default false`. Households that pool their
--  money (no who-owes-whom) simply leave it off — the default. Any member can
--  toggle it via the set_group_settle_up() RPC (group updates are otherwise
--  owner-only under RLS, but this is a household preference, not admin action).
-- ============================================================================

alter table public.groups
  add column if not exists settle_up boolean not null default false;

create or replace function public.set_group_settle_up(p_group_id uuid, p_enabled boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_group_member(p_group_id, auth.uid()) then
    raise exception 'Not a member of this group';
  end if;
  update public.groups set settle_up = p_enabled where id = p_group_id;
end;
$$;

grant execute on function public.set_group_settle_up(uuid, boolean) to authenticated;
