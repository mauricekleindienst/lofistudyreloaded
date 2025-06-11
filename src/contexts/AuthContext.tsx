"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '../utils/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error: unknown }>;
  signUp: (email: string, password: string) => Promise<{ error: unknown }>;
  signOut: () => Promise<void>;
  signInWithProvider: (provider: 'discord' | 'github' | 'google') => Promise<{ error: unknown }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    // Check if Supabase is properly configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const configured = supabaseUrl && 
                     supabaseKey && 
                     supabaseUrl !== 'your_supabase_project_url' && 
                     supabaseKey !== 'your_supabase_anon_key';
    
    setIsConfigured(!!configured);

    if (!configured) {
      console.warn('Supabase not configured. Authentication features will be disabled.');
      setLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);  const signIn = async (email: string, password: string) => {
    if (!isConfigured) {
      return { error: { message: 'Authentication not configured' } };
    }    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch {
      return { error: { message: 'Authentication service unavailable' } };
    }
  };

  const signUp = async (email: string, password: string) => {
    if (!isConfigured) {
      return { error: { message: 'Authentication not configured' } };
    }    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { error };
    } catch {
      return { error: { message: 'Authentication service unavailable' } };
    }
  };

  const signOut = async () => {
    if (!isConfigured) return;    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  const signInWithProvider = async (provider: 'discord' | 'github' | 'google') => {
    if (!isConfigured) {
      return { error: { message: 'Authentication not configured' } };
    }
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }      });
      return { error };
    } catch {
      return { error: { message: 'Authentication service unavailable' } };
    }
  };

  const value = {
    user,
    session,
    loading,
    isConfigured,
    signIn,
    signUp,
    signOut,
    signInWithProvider,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
