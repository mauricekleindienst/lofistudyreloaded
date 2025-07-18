"use client";

import { useEffect, useState, useCallback } from 'react';
import { db, Todo, Note, PomodoroStats, UserSettings } from '../lib/database';
import { useAuth } from '../contexts/AuthContext';
import { useLocalCache } from './useLocalCache';

export function useDataPersistence() {
  const authContext = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Local cache for unauthenticated users
  const localCache = useLocalCache();

  const isAuthenticated = authContext?.user !== null && authContext?.isConfigured;

  // Helper to handle async operations with loading and error states
  const withLoadingAndError = useCallback(async <T>(operation: () => Promise<T>): Promise<T | null> => {
    if (!isAuthenticated) {
      return null;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await operation();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Database operation error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Todo operations
  const loadTodos = useCallback(async (): Promise<Todo[]> => {
    if (!isAuthenticated) return [];
    return await withLoadingAndError(() => db.getTodos()) || [];
  }, [isAuthenticated, withLoadingAndError]);

  const saveTodo = useCallback(async (todo: Todo): Promise<Todo | null> => {
    return await withLoadingAndError(() => db.saveTodo(todo));
  }, [withLoadingAndError]);

  const updateTodo = useCallback(async (id: number, updates: Partial<Todo>): Promise<Todo | null> => {
    return await withLoadingAndError(() => db.updateTodo(id, updates));
  }, [withLoadingAndError]);

  const deleteTodo = useCallback(async (id: number): Promise<boolean> => {
    return await withLoadingAndError(() => db.deleteTodo(id)) || false;
  }, [withLoadingAndError]);

  // Note operations
  const loadNotes = useCallback(async (): Promise<Note[]> => {
    if (!isAuthenticated) return [];
    return await withLoadingAndError(() => db.getNotes()) || [];
  }, [isAuthenticated, withLoadingAndError]);

  const saveNote = useCallback(async (note: Note): Promise<Note | null> => {
    return await withLoadingAndError(() => db.saveNote(note));
  }, [withLoadingAndError]);

  const updateNote = useCallback(async (id: number, updates: Partial<Note>): Promise<Note | null> => {
    return await withLoadingAndError(() => db.updateNote(id, updates));
  }, [withLoadingAndError]);

  const deleteNote = useCallback(async (id: number): Promise<boolean> => {
    return await withLoadingAndError(() => db.deleteNote(id)) || false;
  }, [withLoadingAndError]);

  // Pomodoro operations - Enhanced with local caching
  const updatePomodoroStats = useCallback(async (stats: PomodoroStats): Promise<boolean> => {
    if (isAuthenticated) {
      const result = await withLoadingAndError(() => db.updatePomodoroStats(stats));
      return result !== null;
    } else {
      // For unauthenticated users, stats are calculated dynamically
      return true;
    }
  }, [isAuthenticated, withLoadingAndError]);

  const loadPomodoroStats = useCallback(async (days?: number): Promise<PomodoroStats[]> => {
    if (isAuthenticated && authContext?.user?.id) {
      return await withLoadingAndError(() => db.getPomodoroStats(authContext.user!.id, days)) || [];
    } else {
      // Get stats from local cache
      const localStats = localCache.getPomodoroStats();
      return [{
        id: 1,
        user_id: 'guest',
        date: new Date().toISOString().split('T')[0],
        pomodoro_count: localStats.sessionsToday,
        total_focus_time_minutes: localStats.minutesToday,
        category: 'Mixed'
      }];
    }
  }, [isAuthenticated, authContext.user, localCache, withLoadingAndError]);

  // Get combined stats for both authenticated and unauthenticated users
  const getCombinedPomodoroStats = useCallback(() => {
    if (isAuthenticated) {
      // For authenticated users, we would typically load from database
      return null; // This would be implemented to combine DB stats
    } else {
      // For unauthenticated users, get from local cache
      return localCache.getPomodoroStats();
    }
  }, [isAuthenticated, localCache]);

  // User settings operations
  const loadUserSettings = useCallback(async (): Promise<UserSettings | null> => {
    if (!isAuthenticated) return null;
    return await withLoadingAndError(() => db.getUserSettings());
  }, [isAuthenticated, withLoadingAndError]);

  const saveUserSettings = useCallback(async (settings: Partial<UserSettings>): Promise<boolean> => {
    return await withLoadingAndError(() => db.saveUserSettings(settings)) || false;
  }, [withLoadingAndError]);

  // Background operations
  const saveSelectedBackground = useCallback(async (backgroundId: string): Promise<boolean> => {
    return await withLoadingAndError(() => db.saveSelectedBackground(backgroundId)) || false;
  }, [withLoadingAndError]);

  const loadSelectedBackground = useCallback(async (): Promise<string | null> => {
    if (!isAuthenticated) return null;
    return await withLoadingAndError(() => db.getSelectedBackground());
  }, [isAuthenticated, withLoadingAndError]);

  // Leaderboard operations
  const loadLeaderboard = useCallback(async () => {
    if (!isAuthenticated) return [];
    return await withLoadingAndError(() => db.getLeaderboard()) || [];
  }, [isAuthenticated, withLoadingAndError]);

  // Auto-sync operations when user logs in/out
  useEffect(() => {
    if (isAuthenticated) {
      // Optional: Trigger initial data sync when user becomes authenticated
      console.log('User authenticated, data persistence enabled');
    }
  }, [isAuthenticated]);

  return {
    isAuthenticated,
    isLoading,
    error,
    // Todo operations
    loadTodos,
    saveTodo,
    updateTodo,
    deleteTodo,
    // Note operations
    loadNotes,
    saveNote,
    updateNote,
    deleteNote,
    // Pomodoro operations
    updatePomodoroStats,
    loadPomodoroStats,
    getCombinedPomodoroStats,
    // User settings
    loadUserSettings,
    saveUserSettings,
    // Background operations
    saveSelectedBackground,
    loadSelectedBackground,
    // Leaderboard
    loadLeaderboard,
  };
}
