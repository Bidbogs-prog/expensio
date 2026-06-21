"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, Search, UserPlus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/member-avatar";
import { memberLabel } from "@/lib/member-ui";
import {
  useCancelInvite,
  useGroupPendingInvites,
  useInviteUser,
  useUserSearch,
} from "@/lib/group-queries";

export function InvitePeople({
  groupId,
  memberIds,
}: {
  groupId: string;
  memberIds: Set<string>;
}) {
  const [query, setQuery] = useState("");
  const { data: results, isFetching } = useUserSearch(query);
  const { data: pending } = useGroupPendingInvites(groupId);
  const invite = useInviteUser(groupId);
  const cancel = useCancelInvite(groupId);

  const pendingIds = useMemo(
    () => new Set((pending ?? []).map((p) => p.invitee_id)),
    [pending]
  );

  // Hide people who are already members or already invited.
  const visible = useMemo(
    () => (results ?? []).filter((p) => !memberIds.has(p.id)),
    [results, memberIds]
  );

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people by name or email"
          className="pl-9 shadow-soft"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {query.trim().length >= 2 && (
        <div className="space-y-1.5">
          {visible.length === 0 && !isFetching ? (
            <p className="px-1 py-2 text-xs text-muted-foreground">No people found for “{query}”.</p>
          ) : (
            visible.map((p) => {
              const label = memberLabel(p);
              const invited = pendingIds.has(p.id);
              const busy = invite.isPending && invite.variables === p.id;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg border border-border/60 bg-secondary/30 p-2"
                >
                  <MemberAvatar id={p.id} label={label} avatarUrl={p.avatar_url} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{label}</p>
                    {p.email && <p className="truncate text-xs text-muted-foreground">{p.email}</p>}
                  </div>
                  <Button
                    size="sm"
                    variant={invited ? "outline" : "default"}
                    disabled={invited || busy}
                    onClick={() => invite.mutate(p.id)}
                    className="h-8 shrink-0"
                  >
                    {busy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : invited ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <UserPlus className="h-3.5 w-3.5" />
                    )}
                    {invited ? "Invited" : "Invite"}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      )}

      {pending && pending.length > 0 && (
        <div className="space-y-1.5 border-t border-border/60 pt-3">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Pending invites
          </p>
          {pending.map((p) => {
            const label = p.invitee_name || p.invitee_email || "Invited person";
            return (
              <div key={p.invite_id} className="flex items-center gap-3 px-1 py-0.5">
                <MemberAvatar id={p.invitee_id} label={label} size={26} />
                <span className="min-w-0 flex-1 truncate text-sm">{label}</span>
                <span className="text-xs text-amber-400">Pending</span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => cancel.mutate(p.invite_id)}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  aria-label="Cancel invite"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
