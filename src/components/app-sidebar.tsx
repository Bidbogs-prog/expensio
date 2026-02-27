"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Wallet, TrendingDown, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";

export function AppSidebar() {
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
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

  const items = [
    {
      title: "Dashboard",
      url: "/",
      icon: LayoutDashboard,
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Expenses",
      url: "/expenses",
      icon: TrendingDown,
      color: "from-red-500 to-orange-500",
    },
    {
      title: "Income",
      url: "/income",
      icon: Wallet,
      color: "from-blue-500 to-cyan-500",
    },
  ];

  return (
    <Sidebar className="border-r border-sidebar-border/50">
      <SidebarContent className="pt-4">
        {/* App Logo/Title */}
        <div className="px-6 pb-6 mb-2">
          <div className="flex items-center gap-3">
            {user?.user_metadata?.avatar_url && !user.is_anonymous && (
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-medium relative">
                <Image
                  src={user.user_metadata.avatar_url}
                  alt="User avatar"
                  width={40}
                  height={40}
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
            {(!user?.user_metadata?.avatar_url || user?.is_anonymous) && (
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-medium">
                <Image src={"/anonymous.png"} alt="" width={64} height={64} />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Expensio
              </h2>
              <p className="text-xs text-muted-foreground">Finance Tracker</p>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-3">
              {items.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`
                        transition-all duration-200 rounded-lg
                        ${
                          isActive
                            ? "bg-primary/10 text-primary shadow-soft hover:bg-primary/15 font-medium"
                            : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                        }
                      `}
                    >
                      <Link
                        href={item.url}
                        className="flex items-center gap-3 px-3 py-2.5"
                      >
                        <div
                          className={`
                          w-8 h-8 rounded-lg flex items-center justify-center
                          ${
                            isActive
                              ? `bg-gradient-to-br ${item.color} shadow-soft`
                              : "bg-sidebar-accent/30"
                          }
                        `}
                        >
                          <item.icon
                            className={`w-4 h-4 ${
                              isActive
                                ? "text-white"
                                : "text-sidebar-foreground"
                            }`}
                          />
                        </div>
                        <span className="text-sm">{item.title}</span>
                        {isActive && (
                          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"></div>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sign Out Button */}
        <div className="mt-auto px-3 pb-4">
          <Button
            onClick={signOut}
            variant="destructive"
            size="sm"
            disabled={isSigningOut}
            className="w-full shadow-soft hover:shadow-medium transition-smooth"
          >
            {isSigningOut ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Signing Out...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-1.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign Out
              </>
            )}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
