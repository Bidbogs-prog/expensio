-- ============================================================================
-- Expensio · Family Groups
-- Shared household ledger + invite/accept membership.
--
-- HOW TO APPLY: open Supabase → SQL Editor → paste this whole file → Run.
-- It is idempotent (safe to run more than once).
--
-- Ordering matters: `language sql` functions are body-checked at creation time,
-- so all referenced TABLES are created first, THEN the helper functions, THEN
-- the policies that use them.
--
-- Assumes `expenses` and `income` already have RLS enabled with the usual
-- "user_id = auth.uid()" own-data policies (Supabase default). The expense/income
-- policies at the bottom only ADD read access for group co-members; multiple
-- permissive policies are OR-ed, so existing access is preserved.
-- ============================================================================

-- ── PART A · Tables ───────────────────────────────────────────────────────────

-- Public-facing identity, populated from auth.users.
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  avatar_url text,
  updated_at timestamptz default now()
);

create table if not exists public.groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- FK to profiles (not auth.users) so PostgREST can embed member identity.
create table if not exists public.group_members (
  group_id  uuid not null references public.groups(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  role      text not null default 'member',
  joined_at timestamptz default now(),
  primary key (group_id, user_id)
);

create table if not exists public.group_invites (
  id         uuid primary key default gen_random_uuid(),
  group_id   uuid not null references public.groups(id) on delete cascade,
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  invitee_id uuid not null references public.profiles(id) on delete cascade,
  status     text not null default 'pending',
  created_at timestamptz default now(),
  unique (group_id, invitee_id)
);

alter table public.profiles       enable row level security;
alter table public.groups         enable row level security;
alter table public.group_members  enable row level security;
alter table public.group_invites  enable row level security;

-- ── PART B · Helper functions (SECURITY DEFINER bypasses RLS → no recursion) ──
create or replace function public.is_group_member(gid uuid, uid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = uid
  );
$$;

create or replace function public.shares_group_with(target uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1
    from public.group_members a
    join public.group_members b on a.group_id = b.group_id
    where a.user_id = auth.uid() and b.user_id = target
  );
$$;

-- ── PART C · Policies ─────────────────────────────────────────────────────────

-- profiles
drop policy if exists "read own and co-member profiles" on public.profiles;
create policy "read own and co-member profiles"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_group_with(id));

drop policy if exists "users manage own profile" on public.profiles;
create policy "users manage own profile"
  on public.profiles for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- groups
drop policy if exists "members read their groups" on public.groups;
create policy "members read their groups"
  on public.groups for select to authenticated
  using (public.is_group_member(id, auth.uid()));

drop policy if exists "users create groups" on public.groups;
create policy "users create groups"
  on public.groups for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "owner updates group" on public.groups;
create policy "owner updates group"
  on public.groups for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "owner deletes group" on public.groups;
create policy "owner deletes group"
  on public.groups for delete to authenticated
  using (owner_id = auth.uid());

-- group_members
drop policy if exists "members read co-members" on public.group_members;
create policy "members read co-members"
  on public.group_members for select to authenticated
  using (public.is_group_member(group_id, auth.uid()));

drop policy if exists "owner adds members or self-join" on public.group_members;
create policy "owner adds members or self-join"
  on public.group_members for insert to authenticated
  with check (
    user_id = auth.uid()
    or exists (select 1 from public.groups g where g.id = group_id and g.owner_id = auth.uid())
  );

drop policy if exists "leave or owner removes" on public.group_members;
create policy "leave or owner removes"
  on public.group_members for delete to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.groups g where g.id = group_id and g.owner_id = auth.uid())
  );

-- group_invites
drop policy if exists "see invites involving me" on public.group_invites;
create policy "see invites involving me"
  on public.group_invites for select to authenticated
  using (
    invitee_id = auth.uid()
    or inviter_id = auth.uid()
    or public.is_group_member(group_id, auth.uid())
  );

drop policy if exists "members create invites" on public.group_invites;
create policy "members create invites"
  on public.group_invites for insert to authenticated
  with check (inviter_id = auth.uid() and public.is_group_member(group_id, auth.uid()));

drop policy if exists "invitee updates own invite" on public.group_invites;
create policy "invitee updates own invite"
  on public.group_invites for update to authenticated
  using (invitee_id = auth.uid()) with check (invitee_id = auth.uid());

drop policy if exists "inviter or invitee deletes invite" on public.group_invites;
create policy "inviter or invitee deletes invite"
  on public.group_invites for delete to authenticated
  using (invitee_id = auth.uid() or inviter_id = auth.uid());

-- ── PART D · Keep profiles in sync with auth.users ────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email      = excluded.email,
    full_name  = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for users that already exist.
insert into public.profiles (id, email, full_name, avatar_url)
select id, email, raw_user_meta_data->>'full_name', raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;

-- ── PART E · RPCs for multi-table / privacy-sensitive operations ──────────────
create or replace function public.create_group(p_name text)
returns public.groups language plpgsql security definer set search_path = public as $$
declare g public.groups;
begin
  insert into public.groups (name, owner_id) values (trim(p_name), auth.uid()) returning * into g;
  insert into public.group_members (group_id, user_id, role) values (g.id, auth.uid(), 'owner');
  return g;
end;
$$;

create or replace function public.accept_group_invite(p_invite uuid)
returns void language plpgsql security definer set search_path = public as $$
declare inv public.group_invites;
begin
  select * into inv from public.group_invites
   where id = p_invite and invitee_id = auth.uid() and status = 'pending';
  if inv.id is null then
    raise exception 'Invite not found or already handled';
  end if;
  insert into public.group_members (group_id, user_id, role)
    values (inv.group_id, auth.uid(), 'member')
    on conflict (group_id, user_id) do nothing;
  update public.group_invites set status = 'accepted' where id = p_invite;
end;
$$;

-- Directory search (does not expose the whole profiles table to the client).
create or replace function public.search_users(p_query text)
returns table (id uuid, email text, full_name text, avatar_url text)
language sql security definer set search_path = public stable as $$
  select id, email, full_name, avatar_url
  from public.profiles
  where id <> auth.uid()
    and coalesce(p_query, '') <> ''
    and (email ilike '%' || p_query || '%' or full_name ilike '%' || p_query || '%')
  order by full_name nulls last
  limit 10;
$$;

-- Incoming invites with group + inviter identity (invitee isn't a member yet,
-- so RLS would otherwise hide the group name / inviter profile).
create or replace function public.incoming_invites()
returns table (invite_id uuid, group_id uuid, group_name text, inviter_name text, inviter_email text, created_at timestamptz)
language sql security definer set search_path = public stable as $$
  select i.id, g.id, g.name, p.full_name, p.email, i.created_at
  from public.group_invites i
  join public.groups   g on g.id = i.group_id
  join public.profiles p on p.id = i.inviter_id
  where i.invitee_id = auth.uid() and i.status = 'pending'
  order by i.created_at desc;
$$;

-- Pending invites a group has sent (for the member-management panel).
create or replace function public.group_pending_invites(p_group uuid)
returns table (invite_id uuid, invitee_id uuid, invitee_name text, invitee_email text, status text)
language sql security definer set search_path = public stable as $$
  select i.id, i.invitee_id, p.full_name, p.email, i.status
  from public.group_invites i
  join public.profiles p on p.id = i.invitee_id
  where i.group_id = p_group
    and i.status = 'pending'
    and public.is_group_member(p_group, auth.uid());
$$;

grant execute on function public.create_group(text)          to authenticated;
grant execute on function public.accept_group_invite(uuid)   to authenticated;
grant execute on function public.search_users(text)          to authenticated;
grant execute on function public.incoming_invites()          to authenticated;
grant execute on function public.group_pending_invites(uuid) to authenticated;

-- ── PART F · Share expenses & income with group co-members (additive SELECT) ──
drop policy if exists "group co-members read expenses" on public.expenses;
create policy "group co-members read expenses"
  on public.expenses for select to authenticated
  using (public.shares_group_with(user_id));

drop policy if exists "group co-members read income" on public.income;
create policy "group co-members read income"
  on public.income for select to authenticated
  using (public.shares_group_with(user_id));
