-- ============================================================================
-- Expensio · One-shot currency conversion of personal amounts
--
-- HOW TO APPLY: open Supabase → SQL Editor → paste this whole file → Run.
-- It is idempotent (safe to run more than once). Requires 0001–0008 first.
--
-- WHAT CHANGES
--  New RPC convert_personal_amounts(p_rate): multiplies every PERSONAL-scope
--  amount belonging to the caller by p_rate (rounded to 2 decimals), in one
--  transaction: expenses, income, savings goals/contributions, category
--  budgets, and template line items. Family/group rows are deliberately NOT
--  touched — they are shared with other members whose display currency may
--  differ; converting them would corrupt the shared ledger.
-- ============================================================================

create or replace function public.convert_personal_amounts(p_rate numeric)
returns void language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_rate is null or p_rate <= 0 or p_rate > 1000000 then
    raise exception 'Invalid conversion rate';
  end if;

  update public.expenses
    set amount = round(amount * p_rate, 2)
    where user_id = uid and group_id is null;

  update public.income
    set amount = round(amount * p_rate, 2)
    where user_id = uid and group_id is null;

  update public.savings_goals
    set target_amount      = round(target_amount * p_rate, 2),
        monthly_allocation = round(monthly_allocation * p_rate, 2)
    where user_id = uid and group_id is null;

  update public.savings_contributions
    set amount = round(amount * p_rate, 2)
    where user_id = uid and group_id is null;

  update public.category_budgets
    set monthly_limit = round(monthly_limit * p_rate, 2)
    where user_id = uid and group_id is null;

  update public.budget_templates
    set items = (
      select coalesce(
        jsonb_agg(
          jsonb_set(i, '{amount}',
            to_jsonb(round((i->>'amount')::numeric * p_rate, 2)))
        ),
        '[]'::jsonb
      )
      from jsonb_array_elements(items) i
    )
    where user_id = uid and group_id is null;
end;
$$;

grant execute on function public.convert_personal_amounts(numeric) to authenticated;
