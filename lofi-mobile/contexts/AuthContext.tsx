import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useUserProfile, ExtendedUser } from '../hooks/useUserProfile';
import { Alert, Platform } from 'react-native';

interface AuthContextType {
  user: ExtendedUser | null;
  authUser: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signInWithProvider: (provider: 'google' | 'discord' | 'github') => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

WebBrowser.maybeCompleteAuthSession();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const { getExtendedUser, createProfile, userProfile } = useUserProfile(authUser);

  // Auto-create profile
  useEffect(() => {
    const createUserProfileIfNeeded = async () => {
      if (authUser && !userProfile && !loading) {
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
  }, [authUser, userProfile, createProfile, loading]);

  // Auth State Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setAuthUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  const signInWithProvider = async (provider: 'google' | 'discord' | 'github') => {
    try {
      // Standardize the redirect URL
      // In Expo Go: exp://<IP>:8081/--/auth/callback
      // In Build: lofi-study://auth/callback
      const redirectUrl = Linking.createURL('/auth/callback');
      
      console.log('====================================================');
      console.log('🔐 OAUTH SETUP INSTRUCTIONS');
      console.log('1. Go to Supabase Dashboard > Authentication > URL Configuration');
      console.log('2. Add this EXACT URL to "Redirect URLs":');
      console.log(`   ${redirectUrl}`);
      console.log('3. Ensure your "Site URL" is valid (e.g. http://localhost:3000)');
      console.log('====================================================');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          queryParams: {
             access_type: 'offline',
             prompt: 'consent',
          }
        },
      });

      if (error) {
        Alert.alert('Setup Error', error.message);
        return { error };
      }
      
      if (!data?.url) return { error: { message: 'No auth URL returned' } };

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl
      );

      if (result.type === 'success' && result.url) {
        // Robust param extraction
        const extractParams = (url: string) => {
          const params = new URLSearchParams();
          const parseString = (str: string) => {
            str.split('&').forEach(pair => {
              const [key, value] = pair.split('=');
              if (key && value) params.append(decodeURIComponent(key), decodeURIComponent(value));
            });
          };
          if (url.includes('#')) parseString(url.split('#')[1]);
          if (url.includes('?')) parseString(url.split('?')[1].split('#')[0]);
          return params;
        };

        const params = extractParams(result.url);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const code = params.get('code');

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          return { error: sessionError };
        }
        
        if (code) {
          const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
          return { error: sessionError };
        }
        
        // Check for error description
        const errorDesc = params.get('error_description');
        if (errorDesc) return { error: { message: errorDesc } };
        
        return { error: { message: 'No tokens found. Please check Supabase Redirect URL settings.' } };
      }

      return { error: { message: 'Authentication cancelled', type: 'dismiss' } };
    } catch (err: any) {
      console.error('OAuth Exception:', err);
      return { error: err };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user: getExtendedUser(),
    authUser,
    session,
    loading,
    signIn,
    signUp,
    signInWithProvider,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
