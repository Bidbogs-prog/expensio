// src/components/AuthProvider.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useExpenseStore } from '@/useExpenseStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthProviderProps {
  children: React.ReactNode;
}

type AuthState = 'loading' | 'authenticated' | 'unauthenticated' | 'error';

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [error, setError] = useState<string | null>(null);
  
  const initializeData = useExpenseStore(state => state.initializeData);
  const clearData = useExpenseStore(state => state.clearData);
  
  // Use refs to track initialization to prevent race conditions
  const initializationRef = useRef<{
    isInitializing: boolean;
    hasInitialized: boolean;
  }>({
    isInitializing: false,
    hasInitialized: false
  });

  const handleDataInitialization = useCallback(async () => {
    if (initializationRef.current.isInitializing || initializationRef.current.hasInitialized) {
      return;
    }

    initializationRef.current.isInitializing = true;
    
    try {
      console.log('Starting data initialization...');
      await initializeData();
      initializationRef.current.hasInitialized = true;
      console.log('Data initialization completed successfully');
    } catch (error) {
      console.error('Data initialization failed:', error);
      // Don't set error state here - let the user try to use the app
      // The API calls will handle auth errors individually
    } finally {
      initializationRef.current.isInitializing = false;
    }
  }, [initializeData]);

  const resetInitialization = useCallback(() => {
    initializationRef.current = {
      isInitializing: false,
      hasInitialized: false
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('Initializing authentication...');
        setError(null);
        
        // Get initial session with timeout
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 10000)
        );

        const { data: { session }, error: sessionError } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;
        
        if (!mounted) return;

        if (sessionError) {
          console.error('Session error:', sessionError);
          setAuthState('error');
          setError('Failed to restore session');
          return;
        }

        if (session) {
          console.log('Session found, user is authenticated');
          setAuthState('authenticated');
          // Initialize data after setting auth state
          setTimeout(() => handleDataInitialization(), 100);
        } else {
          console.log('No session found');
          setAuthState('unauthenticated');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setAuthState('error');
          setError(error instanceof Error ? error.message : 'Authentication failed');
        }
      }
    };

    initializeAuth();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id ? 'user-present' : 'no-user');
        
        if (!mounted) return;

        switch (event) {
          case 'SIGNED_IN':
            if (session) {
              resetInitialization();
              setAuthState('authenticated');
              setError(null);
              // Small delay to ensure UI is ready
              setTimeout(() => handleDataInitialization(), 100);
            }
            break;
            
          case 'SIGNED_OUT':
            resetInitialization();
            setAuthState('unauthenticated');
            setError(null);
            clearData?.();
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('Token refreshed successfully');
            // Don't reinitialize data on token refresh
            if (session && authState !== 'authenticated') {
              setAuthState('authenticated');
            }
            break;
            
          case 'PASSWORD_RECOVERY':
          case 'USER_UPDATED':
            // Handle these events without changing auth state
            break;
            
          default:
            console.log('Unhandled auth event:', event);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleDataInitialization, resetInitialization, clearData, authState]);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        console.error('Google sign in error:', error);
        setError(`Failed to sign in with Google: ${error.message}`);
      }
    } catch (error) {
      console.error('Unexpected error during Google sign in:', error);
      setError('Unexpected error during sign in');
    }
  };

  const signInAnonymously = async () => {
    try {
      setError(null);
      console.log('Attempting anonymous sign in...');

      const { data, error } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            full_name: 'Demo User',
            is_demo: true
          }
        }
      });

      if (error) {
        console.error('Anonymous sign in error:', error);
        setError(`Failed to sign in anonymously: ${error.message}`);
      } else {
        console.log('Anonymous sign in successful:', data);
      }
    } catch (error) {
      console.error('Unexpected error during anonymous sign in:', error);
      setError('Unexpected error during anonymous sign in');
    }
  };

  const retryInitialization = () => {
    setError(null);
    setAuthState('loading');
    resetInitialization();
  };

  // Error state
  if (authState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-background to-orange-50">
        <Card className="w-full max-w-md mx-4 sm:mx-auto shadow-strong hover-lift border-red-200">
          <CardHeader className="text-center space-y-2 pb-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold text-red-600">Connection Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-red-600 text-sm">{error}</p>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-primary/10"></div>
            </div>
          </div>
          <p className="mt-6 text-muted-foreground font-medium">Loading your experience...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (authState === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/30 rounded-full blur-3xl"></div>
        </div>

        <Card className="w-full max-w-md mx-4 sm:mx-auto shadow-strong hover-lift relative z-10 border-primary/20">
          <CardHeader className="text-center space-y-3 pb-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-2 shadow-medium">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Welcome to Expensio
            </CardTitle>
            <p className="text-muted-foreground text-sm">Track expenses, manage income, achieve your financial goals</p>
          </CardHeader>
          <CardContent className="space-y-3 pb-6">
            <Button
              onClick={signInWithGoogle}
              className="w-full h-11 shadow-soft hover:shadow-medium transition-smooth"
              variant="outline"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button
              onClick={signInAnonymously}
              className="w-full h-11 gradient-primary text-white shadow-soft hover:shadow-medium transition-smooth border-0"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Try Demo Now
            </Button>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-destructive text-sm text-center">{error}</p>
              </div>
            )}

            <p className="text-xs text-center text-muted-foreground pt-4">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated state
  return <>{children}</>;
}