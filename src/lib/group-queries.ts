"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { groupsApi, invitesApi, profilesApi } from "./groups-api";

export const groupKeys = {
  list: ["groups"] as const,
  members: (id: string) => ["group-members", id] as const,
  incoming: ["incoming-invites"] as const,
  pending: (id: string) => ["group-pending", id] as const,
  search: (q: string) => ["search-users", q] as const,
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
    mutationFn: (name: string) => groupsApi.create(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: groupKeys.list }),
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
