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
import { LayoutDashboard, Loader2, LogOut, TrendingDown, Wallet } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Expenses", url: "/expenses", icon: TrendingDown },
  { title: "Income", url: "/income", icon: Wallet },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 pt-4">
        <div className="flex items-center gap-3">
          {hasAvatar ? (
            <div className="relative h-10 w-10 overflow-hidden rounded-xl shadow-soft">
              <Image
                src={user!.user_metadata.avatar_url}
                alt="User avatar"
                width={40}
                height={40}
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
              <Image src="/anonymous.png" alt="" width={40} height={40} />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold">Expensio</h2>
            <p className="truncate text-xs text-muted-foreground">Finance Tracker</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
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
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="gap-2 p-3">
        <div className="flex items-center justify-between rounded-lg border bg-sidebar-accent/40 px-3 py-1.5">
          <span className="text-xs font-medium text-muted-foreground">Theme</span>
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
