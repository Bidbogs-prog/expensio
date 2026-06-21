// src/components/AuthProvider.tsx
"use client";

import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppShell } from '@/components/app-shell';
import { AuthUserProvider } from '@/lib/auth-context';
import { LandingPage } from '@/components/landing-page';
import { BrandMark } from '@/components/brand-mark';

interface AuthProviderProps {
  children: React.ReactNode;
}

type AuthState = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setError(null);
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session check timeout')), 10000)
        );

        const { data: { session }, error: sessionError } = (await Promise.race([
          sessionPromise,
          timeoutPromise,
        ])) as Awaited<ReturnType<typeof supabase.auth.getSession>>;

        if (!mounted) return;

        if (sessionError) {
          setAuthState('error');
          setError('Failed to restore session');
          return;
        }

        if (session) {
          setUser(session.user);
          setAuthState('authenticated');
        } else {
          setAuthState('unauthenticated');
        }
      } catch (err) {
        if (mounted) {
          setAuthState('error');
          setError(err instanceof Error ? err.message : 'Authentication failed');
        }
      }
    };

    initializeAuth();

    // Single auth subscription for the whole app. Data fetching is handled by
    // React Query once the authenticated AppShell mounts — no manual init here.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      switch (event) {
        case 'SIGNED_IN':
          if (session) {
            setUser(session.user);
            setError(null);
            setAuthState('authenticated');
          }
          break;
        case 'SIGNED_OUT':
          setUser(null);
          setError(null);
          setAuthState('unauthenticated');
          break;
        case 'TOKEN_REFRESHED':
          if (session) {
            setUser(session.user);
            setAuthState((prev) => (prev === 'authenticated' ? prev : 'authenticated'));
          }
          break;
        default:
          break;
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (error) setError(`Failed to sign in with Google: ${error.message}`);
    } catch {
      setError('Unexpected error during sign in');
    }
  };

  const signInAnonymously = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInAnonymously({
        options: { data: { full_name: 'Demo User', is_demo: true } },
      });
      if (error) setError(`Failed to sign in anonymously: ${error.message}`);
    } catch {
      setError('Unexpected error during anonymous sign in');
    }
  };

  const retryInitialization = () => {
    setError(null);
    setAuthState('loading');
  };

  // Error state
  if (authState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-medium border-destructive/30">
          <CardHeader className="text-center space-y-2 pb-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <CardTitle className="text-2xl font-bold text-destructive">Connection Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-destructive text-sm">{error}</p>
            <div className="space-y-3 pt-2">
              <Button onClick={retryInitialization} className="w-full shadow-soft">
                Retry Connection
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full"
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="relative mx-auto h-14 w-14">
            <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-xl animate-pulse-glow" />
            <BrandMark className="relative h-14 w-14" />
          </div>
          <div className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Loading your dashboard…
          </div>
        </div>
      </div>
    );
  }

  // Unauthenticated → full marketing landing page
  if (authState === 'unauthenticated') {
    return (
      <LandingPage
        onSignInGoogle={signInWithGoogle}
        onDemo={signInAnonymously}
        error={error}
      />
    );
  }

  // Authenticated → app shell, with the user shared via context
  return (
    <AuthUserProvider user={user}>
      <AppShell>{children}</AppShell>
    </AuthUserProvider>
  );
}
