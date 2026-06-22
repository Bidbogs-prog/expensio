"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Loader2,
  LogOut,
  Sparkles,
  TrendingDown,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark } from "@/components/brand-mark";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { useAuthUser } from "@/lib/auth-context";
import { useIncomingInvites } from "@/lib/group-queries";
import { usePlan } from "@/lib/plan";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Insights", url: "/insights", icon: Sparkles, badge: "AI" },
  { title: "Expenses", url: "/expenses", icon: TrendingDown },
  { title: "Income", url: "/income", icon: Wallet },
  { title: "Family", url: "/family", icon: Users },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isPro, openUpgrade } = usePlan();
  const user = useAuthUser();
  const { data: invites } = useIncomingInvites();
  const inviteCount = invites?.length ?? 0;
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = async () => {
    try {
      setIsSigningOut(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const hasAvatar = user?.user_metadata?.avatar_url && !user.is_anonymous;
  const displayName =
    user?.user_metadata?.full_name ||
    (user?.is_anonymous ? "Demo User" : user?.email?.split("@")[0]) ||
    "Account";

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 pt-4">
        <Link href="/" className="flex items-center gap-2.5">
          <BrandMark className="h-9 w-9 shrink-0" />
          <div className="min-w-0">
            <h2 className="truncate font-display text-base font-bold tracking-tight">
              Expens<span className="text-primary">io</span>
            </h2>
            <p className="truncate text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              {isPro ? "Pro" : "Money clarity"}
            </p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="pt-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.url;
                const countBadge =
                  item.url === "/family" && inviteCount > 0 ? inviteCount : null;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={cn(
                        "relative transition-smooth",
                        isActive &&
                          "before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-primary"
                      )}
                    >
                      <Link href={item.url}>
                        <item.icon
                          className={cn(
                            "h-4 w-4",
                            isActive ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                        <span className={isActive ? "font-medium" : undefined}>
                          {item.title}
                        </span>
                        {countBadge !== null ? (
                          <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                            {countBadge}
                          </span>
                        ) : item.badge ? (
                          <span className="ml-auto rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-primary">
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-3 p-3">
        {!isPro && (
          <button
            onClick={() => openUpgrade()}
            className="group relative overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-br from-primary/15 to-primary/5 p-3 text-left transition-smooth hover:border-primary/40"
          >
            <div className="aurora-blob -right-6 -top-8 h-20 w-20 bg-primary/30 animate-aurora" />
            <div className="relative flex items-center gap-2 text-sm font-semibold">
              <Zap className="h-4 w-4 text-primary" />
              Go Pro
            </div>
            <p className="relative mt-1 text-xs text-muted-foreground">
              Unlimited AI insights, forecasts & analytics.
            </p>
          </button>
        )}

        <div className="flex items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-2">
          {hasAvatar ? (
            <Image
              src={user!.user_metadata.avatar_url}
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="min-w-0 flex-1 truncate text-xs font-medium">{displayName}</span>
          <ThemeToggle />
        </div>

        <Button
          onClick={signOut}
          variant="outline"
          size="sm"
          disabled={isSigningOut}
          className="w-full"
        >
          {isSigningOut ? (
            <>
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              Signing out…
            </>
          ) : (
            <>
              <LogOut className="mr-1.5 h-4 w-4" />
              Sign out
            </>
          )}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
