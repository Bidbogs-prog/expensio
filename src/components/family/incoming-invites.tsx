"use client";

import { Check, Loader2, Mail, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MemberAvatar } from "@/components/member-avatar";
import {
  useAcceptInvite,
  useDeclineInvite,
  useIncomingInvites,
} from "@/lib/group-queries";

export function IncomingInvites() {
  const { data: invites } = useIncomingInvites();
  const accept = useAcceptInvite();
  const decline = useDeclineInvite();

  if (!invites || invites.length === 0) return null;

  return (
    <Card className="relative overflow-hidden border-primary/25 p-4 shadow-soft">
      <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative mb-3 flex items-center gap-2 text-sm font-semibold">
        <Mail className="h-4 w-4 text-primary" />
        Pending invitations
        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-xs font-bold text-primary">
          {invites.length}
        </span>
      </div>

      <div className="relative space-y-2">
        {invites.map((inv) => {
          const inviter = inv.inviter_name || inv.inviter_email || "Someone";
          const busy =
            (accept.isPending && accept.variables === inv.invite_id) ||
            (decline.isPending && decline.variables === inv.invite_id);
          return (
            <div
              key={inv.invite_id}
              className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3"
            >
              <MemberAvatar id={inv.group_id} label={inv.group_name} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{inv.group_name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  Invited by {inviter}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  size="sm"
                  onClick={() => accept.mutate(inv.invite_id)}
                  disabled={busy}
                  className="h-8"
                >
                  {busy && accept.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Accept
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => decline.mutate(inv.invite_id)}
                  disabled={busy}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  aria-label="Decline"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
