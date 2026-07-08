"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScopeSwitcher } from "@/components/scope-switcher";
import { TransactionForm } from "@/components/transaction-form";
import { TransactionTable } from "@/components/transaction-table";
import { TemplatesBar } from "@/components/templates-bar";
import { useGroups, useGroupMembers } from "@/lib/group-queries";
import { useAuthUser } from "@/lib/auth-context";
import { useRealtimeLedger } from "@/hooks/use-realtime-ledger";
import type { TxKind } from "@/lib/transaction-ui";

/**
 * The full add + manage experience for one transaction kind, with a
 * Personal | Family scope switcher. Personal writes go to the private budget;
 * family writes go to the selected group's shared budget.
 */
export function TransactionWorkspace({ kind }: { kind: TxKind }) {
  const currentUserId = useAuthUser()?.id ?? null;
  const { data: groups = [] } = useGroups();
  const [scope, setScope] = useState<string | null>(null); // null = personal

  // Keep the scope valid if the user's groups change (e.g. leaves a group).
  useEffect(() => {
    if (scope && !groups.some((g) => g.id === scope)) setScope(null);
  }, [groups, scope]);

  const { data: members } = useGroupMembers(scope);
  const memberMap = useMemo(
    () => new Map((members ?? []).map((m) => [m.user_id, m])),
    [members]
  );

  // Live updates from co-members while viewing a shared budget.
  useRealtimeLedger(!!scope);

  const noun = kind === "expense" ? "expense" : "income";

  return (
    <div className="space-y-4">
      {groups.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ScopeSwitcher groups={groups} value={scope} onChange={setScope} />
          <p className="text-xs text-muted-foreground">
            {scope
              ? `Adding shared ${noun} to this household — visible to all members.`
              : `Adding private ${noun} to your personal budget.`}
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Want a shared household budget?{" "}
          <Link href="/" className="inline-flex items-center gap-1 text-primary hover:underline">
            <Users className="h-3.5 w-3.5" />
            Create a family group
          </Link>
          .
        </p>
      )}

      <Card className="space-y-5 p-4 shadow-soft sm:p-6">
        <TransactionForm kind={kind} groupId={scope} />
        <TemplatesBar kind={kind} groupId={scope} />
      </Card>

      <TransactionTable
        kind={kind}
        groupId={scope}
        members={memberMap}
        currentUserId={currentUserId}
      />
    </div>
  );
}
