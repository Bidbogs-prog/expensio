"use client";

import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";

// Single source of truth for the authenticated user. Set once by AuthProvider
// (which already owns the auth subscription) and consumed anywhere — so no other
// component needs its own getUser() call or onAuthStateChange listener.
const AuthUserContext = createContext<User | null>(null);

export function AuthUserProvider({
  user,
  children,
}: {
  user: User | null;
  children: React.ReactNode;
}) {
  return <AuthUserContext.Provider value={user}>{children}</AuthUserContext.Provider>;
}

export function useAuthUser() {
  return useContext(AuthUserContext);
}
