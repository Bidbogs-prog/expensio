"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { contributionsApi, groupsApi, invitesApi, profilesApi } from "./groups-api";
import type { ExpenseContribution, Group, GroupType } from "@/types";

export const groupKeys = {
  list: ["groups"] as const,
  members: (id: string) => ["group-members", id] as const,
  incoming: ["incoming-invites"] as const,
  pending: (id: string) => ["group-pending", id] as const,
  search: (q: string) => ["search-users", q] as const,
  contributions: (id: string) => ["expense-contributions", id] as const,
};

// ── Queries ──────────────────────────────────────────────────────────────────
export function useGroups() {
  return useQuery({ queryKey: groupKeys.list, queryFn: groupsApi.list });
}

export function useGroupMembers(groupId: string | null) {
  return useQuery({
    queryKey: groupKeys.members(groupId ?? "none"),
    queryFn: () => groupsApi.members(groupId as string),
    enabled: !!groupId,
  });
}

export function useIncomingInvites() {
  return useQuery({ queryKey: groupKeys.incoming, queryFn: invitesApi.incoming });
}

export function useGroupPendingInvites(groupId: string | null) {
  return useQuery({
    queryKey: groupKeys.pending(groupId ?? "none"),
    queryFn: () => invitesApi.pending(groupId as string),
    enabled: !!groupId,
  });
}

export function useUserSearch(query: string) {
  const debounced = useDebouncedValue(query.trim(), 300);
  return useQuery({
    queryKey: groupKeys.search(debounced),
    queryFn: () => profilesApi.search(debounced),
    enabled: debounced.length >= 2,
    placeholderData: (prev) => prev, // keep last results visible while typing
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────
export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, type }: { name: string; type: GroupType }) =>
      groupsApi.create(name, type),
    onSuccess: () => qc.invalidateQueries({ queryKey: groupKeys.list }),
  });
}

export function useRenameGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, name }: { groupId: string; name: string }) =>
      groupsApi.rename(groupId, name),
    onMutate: async ({ groupId, name }) => {
      await qc.cancelQueries({ queryKey: groupKeys.list });
      const prev = qc.getQueryData<Group[]>(groupKeys.list);
      qc.setQueryData<Group[]>(groupKeys.list, (old = []) =>
        old.map((g) => (g.id === groupId ? { ...g, name } : g))
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(groupKeys.list, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: groupKeys.list }),
  });
}

// ── Housemate contribution check-offs ────────────────────────────────────────
export function useExpenseContributions(groupId: string | null, enabled = true) {
  return useQuery({
    queryKey: groupKeys.contributions(groupId ?? "none"),
    queryFn: () => contributionsApi.listForGroup(groupId as string),
    enabled: !!groupId && enabled,
  });
}

/** Toggle the caller's "I sent my share" mark on one shared expense. */
export function useToggleContribution(groupId: string, currentUserId: string | null) {
  const qc = useQueryClient();
  const key = groupKeys.contributions(groupId);
  return useMutation({
    mutationFn: ({ expenseId, confirmed }: { expenseId: number; confirmed: boolean }) =>
      confirmed ? contributionsApi.confirm(expenseId) : contributionsApi.retract(expenseId),
    onMutate: async ({ expenseId, confirmed }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<ExpenseContribution[]>(key) ?? [];
      qc.setQueryData<ExpenseContribution[]>(
        key,
        confirmed
          ? [...prev, { expense_id: expenseId, user_id: currentUserId ?? "" }]
          : prev.filter((c) => !(c.expense_id === expenseId && c.user_id === currentUserId))
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useSetGroupSettleUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, enabled }: { groupId: string; enabled: boolean }) =>
      groupsApi.setSettleUp(groupId, enabled),
    onMutate: async ({ groupId, enabled }) => {
      await qc.cancelQueries({ queryKey: groupKeys.list });
      const prev = qc.getQueryData<Awaited<ReturnType<typeof groupsApi.list>>>(groupKeys.list);
      qc.setQueryData<Awaited<ReturnType<typeof groupsApi.list>>>(groupKeys.list, (old = []) =>
        old.map((g) => (g.id === groupId ? { ...g, settle_up: enabled } : g))
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(groupKeys.list, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: groupKeys.list }),
  });
}

export function useInviteUser(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteeId: string) => invitesApi.invite(groupId, inviteeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: groupKeys.pending(groupId) }),
  });
}

export function useCancelInvite(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => invitesApi.cancel(inviteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: groupKeys.pending(groupId) }),
  });
}

export function useAcceptInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => invitesApi.accept(inviteId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.incoming });
      qc.invalidateQueries({ queryKey: groupKeys.list });
    },
  });
}

export function useDeclineInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inviteId: string) => invitesApi.decline(inviteId),
    onSuccess: () => qc.invalidateQueries({ queryKey: groupKeys.incoming }),
  });
}

export function useRemoveMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => groupsApi.removeMember(groupId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: groupKeys.members(groupId) }),
  });
}

export function useLeaveGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (groupId: string) => groupsApi.leave(groupId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: groupKeys.list });
    },
  });
}

// ── small util ───────────────────────────────────────────────────────────────
function useDebouncedValue<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}
