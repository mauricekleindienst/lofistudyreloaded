"use client";

import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/database';

/**
 * The data layer itself decides between the account (signed in) and this
 * device's storage (guest). Components only need `isAuthenticated` as an
 * effect dependency so they reload when the user signs in or out.
 */
export function useDataPersistence() {
  const { user, loading } = useAuth();
  return { db, isAuthenticated: Boolean(user), authLoading: loading };
}
