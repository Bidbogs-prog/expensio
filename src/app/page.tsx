"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { CurrencySelect } from "@/components/currency-select";
import { MonthNavigator } from "@/components/monthNavigator";
import { ScopeSwitcher } from "@/components/scope-switcher";
import { Button } from "@/components/ui/button";
import { PersonalOverview } from "@/components/personal-overview";
import { FamilyOverview } from "@/components/family-overview";
import { IncomingInvites } from "@/components/family/incoming-invites";
import { CreateGroupDialog } from "@/components/family/create-group-dialog";
import { useGroups } from "@/lib/group-queries";

export default function Home() {
  const { data: groups = [] } = useGroups();
  const [scope, setScope] = useState<string | null>(null); // null = personal
  const [showCreate, setShowCreate] = useState(false);

  // Keep the scope valid if the user's groups change (e.g. leaves a group).
  useEffect(() => {
    if (scope && !groups.some((g) => g.id === scope)) setScope(null);
  }, [groups, scope]);

  const isPersonal = scope === null;

  return (
    <div className="min-h-screen">
      <PageHeader
        eyebrow={isPersonal ? "Overview" : "Shared"}
        title="Dashboard"
        subtitle={isPersonal ? "Your money, this month" : "Your household, combined"}
      >
        <div className="hidden sm:block">
          <MonthNavigator />
        </div>
        <CurrencySelect />
      </PageHeader>

      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <div className="flex justify-center sm:hidden">
          <MonthNavigator />
        </div>

        <IncomingInvites />

        {/* Personal | Family scope toggle — same control as the Expenses/Income tabs. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ScopeSwitcher groups={groups} value={scope} onChange={setScope} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreate(true)}
            className="rounded-full"
          >
            <Plus className="h-4 w-4" />
            New group
          </Button>
        </div>

        {isPersonal ? (
          <PersonalOverview />
        ) : (
          <FamilyOverview groupId={scope} onLeft={() => setScope(null)} />
        )}
      </div>

      <CreateGroupDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(id) => setScope(id)}
      />
    </div>
  );
}
