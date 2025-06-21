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
  const [isSigningOut, setIsSigningOut] = useState(false);
  
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
        setError('Failed to sign in with Google');
      }
    } catch (error) {
      console.error('Unexpected error during Google sign in:', error);
      setError('Unexpected error during sign in');
    }
  };

  const signInAnonymously = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInAnonymously();
      
      if (error) {
        console.error('Anonymous sign in error:', error);
        setError('Failed to sign in anonymously');
      }
    } catch (error) {
      console.error('Unexpected error during anonymous sign in:', error);
      setError('Unexpected error during anonymous sign in');
    }
  };

  const signOut = async () => {
    try {
      setIsSigningOut(true);
      setError(null);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        setError('Failed to sign out');
        return;
      }
      
      // The auth state change listener will handle the cleanup
      
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      setError('Unexpected error during sign out');
    } finally {
      setIsSigningOut(false);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-600">Connection Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-red-600">{error}</p>
            <div className="space-y-2">
              <Button onClick={retryInitialization} className="w-full">
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (authState === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome to Expensio</CardTitle>
            <p className="text-gray-600">Sign in to manage your expenses</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={signInWithGoogle} 
              className="w-full"
              variant="outline"
            >
              Sign in with Google
            </Button>
            <Button 
              onClick={signInAnonymously} 
              className="w-full"
              variant="secondary"
            >
              Try Demo (Anonymous)
            </Button>
            {error && (
              <p className="text-red-500 text-sm text-center mt-2">{error}</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated state
  return (
    <div className="relative">
      <div className="absolute bottom-4 left-[80px] z-50">
        <Button 
          onClick={signOut} 
          variant="destructive"
          size="sm"
          disabled={isSigningOut}
          className="bg-red-500 hover:bg-red-600 text-white shadow-sm transition-colors"
        >
          {isSigningOut ? 'Signing Out...' : 'Sign Out'}
        </Button>
      </div>
      {children}
    </div>
  );
}