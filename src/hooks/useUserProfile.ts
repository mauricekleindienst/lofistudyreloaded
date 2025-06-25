import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { DatabaseService, ExtendedUserProfile } from '../lib/database';

export interface ExtendedUser extends User {
  avatar_url?: string;
  full_name?: string;
  premium?: boolean;
  streak_count?: number;
  total_focus_time?: number;
  settings?: Record<string, unknown>;
}

export const useUserProfile = (user: User | null) => {
  const [userProfile, setUserProfile] = useState<ExtendedUserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dbService = new DatabaseService();

  // Load user profile when user changes
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) {
        setUserProfile(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const profile = await dbService.getUserProfile(user.id);
        setUserProfile(profile);
      } catch (err) {
        console.error('Failed to load user profile:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [user]);

  // Update user profile
  const updateProfile = async (updates: Partial<ExtendedUserProfile>): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      const success = await dbService.updateUserProfile(user.id, updates);
      if (success && userProfile) {
        setUserProfile({ ...userProfile, ...updates });
      }
      return success;
    } catch (err) {
      console.error('Failed to update user profile:', err);
      setError('Failed to update user profile');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Create user profile (for new users)
  const createProfile = async (profileData: Omit<ExtendedUserProfile, 'created_at' | 'updated_at'>): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      const success = await dbService.createUserProfile({
        ...profileData,
        id: user.id,
        email: user.email || ''
      });
      
      if (success) {
        const newProfile = await dbService.getUserProfile(user.id);
        setUserProfile(newProfile);
      }
      
      return success;
    } catch (err) {
      console.error('Failed to create user profile:', err);
      setError('Failed to create user profile');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get extended user object that combines auth user and profile data
  const getExtendedUser = (): ExtendedUser | null => {
    if (!user) return null;

    return {
      ...user,
      avatar_url: userProfile?.avatar_url,
      full_name: userProfile?.full_name,
      premium: userProfile?.premium,
      streak_count: userProfile?.streak_count,
      total_focus_time: userProfile?.total_focus_time,
      settings: userProfile?.settings
    };
  };

  return {
    userProfile,
    loading,
    error,
    updateProfile,
    createProfile,
    getExtendedUser
  };
};
