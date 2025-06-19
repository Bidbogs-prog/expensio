// src/components/AuthProvider.tsx
"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useExpenseStore } from '@/useExpenseStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const initializeData = useExpenseStore(state => state.initializeData);
  const clearData = useExpenseStore(state => state.clearData); // Add this to your store if it doesn't exist

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session);
      setIsAuthenticated(!!session);
      if (session) {
        initializeData();
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setIsAuthenticated(!!session);
        
        if (session && event === 'SIGNED_IN') {
          await initializeData();
        } else if (event === 'SIGNED_OUT') {
          // Clear any stored data when signing out
          if (clearData) {
            clearData();
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [initializeData, clearData]);

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      if (error) {
        console.error('Error signing in:', error);
        alert('Failed to sign in with Google');
      }
    } catch (error) {
      console.error('Unexpected error during Google sign in:', error);
    }
  };

  const signInAnonymously = async () => {
    try {
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.error('Error signing in anonymously:', error);
        alert('Failed to sign in anonymously');
      }
    } catch (error) {
      console.error('Unexpected error during anonymous sign in:', error);
    }
  };

  const signOut = async () => {
    try {
      setIsSigningOut(true);
      console.log('Starting sign out process...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        alert('Failed to sign out. Please try again.');
        return;
      }
      
      console.log('Sign out successful');
      
      // Force clear auth state if it doesn't happen automatically
      setIsAuthenticated(false);
      
      // Clear any stored data
      if (clearData) {
        clearData();
      }
      
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
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
          </CardContent>
        </Card>
      </div>
    );
  }

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