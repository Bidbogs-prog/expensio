// src/lib/groups-api.ts
// Supabase access for family groups: groups, members, directory search, invites,
// and the shared (multi-member) transaction ledger.
import { supabase } from "./supabase";
import { getCurrentUserId } from "./api";
import type {
  ExpenseContribution,
  Group,
  GroupMember,
  GroupType,
  IncomingInvite,
  PendingInvite,
  Profile,
} from "@/types";

export const groupsApi = {
  async list(): Promise<Group[]> {
    // RLS scopes this to groups the caller belongs to.
    const { data, error } = await supabase
      .from("groups")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async create(name: string, type: GroupType = "family"): Promise<Group> {
    const { data, error } = await supabase.rpc("create_group", {
      p_name: name,
      p_type: type,
    });
    if (error) throw new Error(error.message);
    return data as Group;
  },

  // Owner-only under RLS ("owner updates group", 0001).
  async rename(groupId: string, name: string): Promise<Group> {
    const { data, error } = await supabase
      .from("groups")
      .update({ name: name.trim() })
      .eq("id", groupId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Group;
  },

  async members(groupId: string): Promise<GroupMember[]> {
    const { data, error } = await supabase
      .from("group_members")
      .select("user_id, role, joined_at, profile:profiles(id, email, full_name, avatar_url)")
      .eq("group_id", groupId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((m) => ({
      user_id: m.user_id as string,
      role: m.role as string,
      joined_at: m.joined_at as string | undefined,
      // PostgREST returns the embedded to-one relation as an object (or null).
      profile: (Array.isArray(m.profile) ? m.profile[0] : m.profile) as Profile | null,
    }));
  },

  // Any member may toggle; enforced by the RPC, not the owner-only RLS policy.
  async setSettleUp(groupId: string, enabled: boolean): Promise<void> {
    const { error } = await supabase.rpc("set_group_settle_up", {
      p_group_id: groupId,
      p_enabled: enabled,
    });
    if (error) throw new Error(error.message);
  },

  async leave(groupId: string): Promise<void> {
    const uid = await getCurrentUserId();
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", uid);
    if (error) throw new Error(error.message);
  },

  async removeMember(groupId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
  },
};

// Housemate "I sent my share" check-offs on shared expenses.
export const contributionsApi = {
  /** All check-offs for a group's expenses (any month; small table). */
  async listForGroup(groupId: string): Promise<ExpenseContribution[]> {
    const { data, error } = await supabase
      .from("expense_contributions")
      .select("expense_id, user_id, confirmed_at, expense:expenses!inner(group_id)")
      .eq("expense.group_id", groupId);
    if (error) throw new Error(error.message);
    return (data ?? []).map(({ expense_id, user_id, confirmed_at }) => ({
      expense_id: expense_id as number,
      user_id: user_id as string,
      confirmed_at: confirmed_at as string,
    }));
  },

  async confirm(expenseId: number): Promise<void> {
    const uid = await getCurrentUserId();
    const { error } = await supabase
      .from("expense_contributions")
      .insert({ expense_id: expenseId, user_id: uid });
    if (error && error.code !== "23505") throw new Error(error.message); // dup = already confirmed
  },

  async retract(expenseId: number): Promise<void> {
    const uid = await getCurrentUserId();
    const { error } = await supabase
      .from("expense_contributions")
      .delete()
      .eq("expense_id", expenseId)
      .eq("user_id", uid);
    if (error) throw new Error(error.message);
  },
};

export const profilesApi = {
  async search(query: string): Promise<Profile[]> {
    const { data, error } = await supabase.rpc("search_users", { p_query: query });
    if (error) throw new Error(error.message);
    return (data ?? []) as Profile[];
  },
};

export const invitesApi = {
  async incoming(): Promise<IncomingInvite[]> {
    const { data, error } = await supabase.rpc("incoming_invites");
    if (error) throw new Error(error.message);
    return (data ?? []) as IncomingInvite[];
  },

  async pending(groupId: string): Promise<PendingInvite[]> {
    const { data, error } = await supabase.rpc("group_pending_invites", { p_group: groupId });
    if (error) throw new Error(error.message);
    return (data ?? []) as PendingInvite[];
  },

  async invite(groupId: string, inviteeId: string): Promise<void> {
    const uid = await getCurrentUserId();
    const { error } = await supabase.from("group_invites").insert({
      group_id: groupId,
      inviter_id: uid,
      invitee_id: inviteeId,
      status: "pending",
    });
    if (error) throw new Error(error.message);
  },

  async accept(inviteId: string): Promise<void> {
    const { error } = await supabase.rpc("accept_group_invite", { p_invite: inviteId });
    if (error) throw new Error(error.message);
  },

  async decline(inviteId: string): Promise<void> {
    const { error } = await supabase
      .from("group_invites")
      .update({ status: "declined" })
      .eq("id", inviteId);
    if (error) throw new Error(error.message);
  },

  async cancel(inviteId: string): Promise<void> {
    const { error } = await supabase.from("group_invites").delete().eq("id", inviteId);
    if (error) throw new Error(error.message);
  },
};
