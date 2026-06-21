"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { QueryProvider } from "@/components/query-provider";
import { PlanProvider } from "@/lib/plan";

/** Authenticated application chrome: data layer + plan context + sidebar. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <PlanProvider>
        <SidebarProvider>
          <div className="relative flex h-full w-full">
            <AppSidebar />
            <main className="relative flex-1 overflow-auto">
              <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-fade opacity-[0.35]" />
              {children}
            </main>
          </div>
        </SidebarProvider>
      </PlanProvider>
    </QueryProvider>
  );
}
