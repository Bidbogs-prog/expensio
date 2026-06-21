"use client";

import { Crown, LogOut, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/member-avatar";
import { memberLabel } from "@/lib/member-ui";
import { useLeaveGroup, useRemoveMember } from "@/lib/group-queries";
import type { Group, GroupMember } from "@/types";

export function MemberRoster({
  group,
  members,
  currentUserId,
  onLeft,
}: {
  group: Group;
  members: GroupMember[];
  currentUserId: string | null;
  onLeft?: () => void;
}) {
  const isOwner = group.owner_id === currentUserId;
  const remove = useRemoveMember(group.id);
  const leave = useLeaveGroup();

  return (
    <div className="space-y-1">
      {members.map((m) => {
        const label = memberLabel(m.profile);
        const isSelf = m.user_id === currentUserId;
        const owner = m.user_id === group.owner_id;
        return (
          <div
            key={m.user_id}
            className="group flex items-center gap-3 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-secondary/40"
          >
            <MemberAvatar id={m.user_id} label={label} avatarUrl={m.profile?.avatar_url} size={34} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {label} {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
              </p>
              {m.profile?.email && (
                <p className="truncate text-xs text-muted-foreground">{m.profile.email}</p>
              )}
            </div>

            {owner ? (
              <span className="flex items-center gap-1 rounded-full bg-primary/12 px-2 py-0.5 text-[11px] font-semibold text-primary">
                <Crown className="h-3 w-3" />
                Owner
              </span>
            ) : isSelf ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await leave.mutateAsync(group.id);
                  onLeft?.();
                }}
                disabled={leave.isPending}
                className="h-8 text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" />
                Leave
              </Button>
            ) : isOwner ? (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => remove.mutate(m.user_id)}
                disabled={remove.isPending}
                className="h-8 w-8 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                aria-label={`Remove ${label}`}
              >
                <UserMinus className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
