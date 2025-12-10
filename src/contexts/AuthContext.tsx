"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '../utils/supabase/client';
import { useUserProfile, ExtendedUser } from '../hooks/useUserProfile';

interface AuthContextType {
  user: ExtendedUser | null;
  authUser: User | null;
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
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [supabase] = useState(() => createClient());

  // Use the user profile hook to get extended user data
  const { getExtendedUser, createProfile, userProfile } = useUserProfile(authUser);

  // Auto-create user profile for new users (especially OAuth users)
  useEffect(() => {
    const createUserProfileIfNeeded = async () => {
      if (authUser && !userProfile && isConfigured) {
        try {
          const profileData = {
            id: authUser.id,
            email: authUser.email || '',
            full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || '',
            avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
            premium: false,
            streak_count: 0,
            total_focus_time: 0,
            settings: {}
          };

          await createProfile(profileData);
        } catch (error) {
          console.error('Failed to create user profile:', error);
        }
      }
    };

    createUserProfileIfNeeded();
  }, [authUser, userProfile, createProfile, isConfigured]);

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
        setAuthUser(session?.user ?? null);
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
        setAuthUser(session?.user ?? null);
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
    user: getExtendedUser(),
    authUser,
    session,
    loading,
    isConfigured,
    signIn,
    signUp,
    signOut,
    signInWithProvider,
  };

  return (
    <AuthContext value={value}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
