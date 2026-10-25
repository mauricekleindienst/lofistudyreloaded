"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError, toast } from '../lib/api';
import { db } from '../lib/database';

export type OAuthProvider = 'discord' | 'github' | 'google';

export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  has_password: boolean;
  providers: string[];
  settings: Record<string, unknown>;
  created_at: string;
}

type Result = { error: string | null };

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  providers: OAuthProvider[];
  signIn: (email: string, password: string) => Promise<Result>;
  signUp: (email: string, password: string, fullName?: string) => Promise<Result>;
  signOut: () => Promise<void>;
  signInWithProvider: (provider: OAuthProvider) => void;
  updateProfile: (changes: { full_name?: string; avatar_url?: string | null }) => Promise<Result>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<Result>;
  deleteAccount: (password: string) => Promise<Result>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const message = (err: unknown) => (err instanceof ApiError ? err.message : 'Something went wrong, please try again.');

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<OAuthProvider[]>([]);

  // applyUser switches the data layer *before* setUser, so components reloading on the
  // new user already talk to the right backend. (Syncing it from `user` during render
  // flipped it back to guest mode mid-import, when `user` was still null.)
  const applyUser = useCallback(async (next: AppUser | null, { importGuest = false } = {}) => {
    db.setAuthenticated(Boolean(next));
    if (next && importGuest) {
      const imported = await db.importGuestData();
      if (imported > 0) toast(`Moved ${imported} item${imported === 1 ? '' : 's'} from this device into your account.`, 'success');
    }
    setUser(next);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { user: me } = await api<{ user: AppUser | null }>('/api/auth/me');
      await applyUser(me, { importGuest: true });
    } catch {
      await applyUser(null);
    }
  }, [applyUser]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refresh();
      if (!cancelled) setLoading(false);
    })();
    api<{ providers: OAuthProvider[] }>('/api/auth/providers')
      .then((r) => !cancelled && setProviders(r.providers))
      .catch(() => undefined);

    // Surface OAuth redirect results (?auth_error=… / ?signed_in=1) once, then clean the URL.
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('auth_error');
    if (authError) toast(authError, 'error');
    if (params.get('signed_in')) toast('Signed in — welcome!', 'success');
    if (authError || params.get('signed_in')) {
      params.delete('auth_error');
      params.delete('signed_in');
      const qs = params.toString();
      window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
    }
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<Result> => {
      try {
        const { user: me } = await api<{ user: AppUser }>('/api/auth/login', { method: 'POST', json: { email, password } });
        await applyUser(me, { importGuest: true });
        return { error: null };
      } catch (err) {
        return { error: message(err) };
      }
    },
    [applyUser]
  );

  const signUp = useCallback(
    async (email: string, password: string, fullName?: string): Promise<Result> => {
      try {
        const { user: me } = await api<{ user: AppUser }>('/api/auth/register', {
          method: 'POST',
          json: { email, password, full_name: fullName },
        });
        await applyUser(me, { importGuest: true });
        return { error: null };
      } catch (err) {
        return { error: message(err) };
      }
    },
    [applyUser]
  );

  const signOut = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      // the cookie is httpOnly; if the request failed the session simply stays valid server-side
    }
    await applyUser(null);
    toast('Signed out', 'info');
  }, [applyUser]);

  const signInWithProvider = useCallback((provider: OAuthProvider) => {
    window.location.assign(`/api/auth/oauth/${provider}`);
  }, []);

  const updateProfile = useCallback(async (changes: { full_name?: string; avatar_url?: string | null }): Promise<Result> => {
    try {
      const { user: me } = await api<{ user: AppUser }>('/api/profile', { method: 'PATCH', json: changes });
      setUser(me);
      return { error: null };
    } catch (err) {
      return { error: message(err) };
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<Result> => {
    try {
      await api('/api/auth/password', {
        method: 'POST',
        json: { current_password: currentPassword, new_password: newPassword },
      });
      setUser((u) => (u ? { ...u, has_password: true } : u));
      return { error: null };
    } catch (err) {
      return { error: message(err) };
    }
  }, []);

  const deleteAccount = useCallback(
    async (password: string): Promise<Result> => {
      try {
        await api('/api/account', { method: 'DELETE', json: { confirm: 'DELETE', password } });
        await applyUser(null);
        return { error: null };
      } catch (err) {
        return { error: message(err) };
      }
    },
    [applyUser]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      providers,
      signIn,
      signUp,
      signOut,
      signInWithProvider,
      updateProfile,
      changePassword,
      deleteAccount,
      refresh,
    }),
    [user, loading, providers, signIn, signUp, signOut, signInWithProvider, updateProfile, changePassword, deleteAccount, refresh]
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
