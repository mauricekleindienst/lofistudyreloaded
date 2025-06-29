/**
 * Enhanced Data Persistence Hook
 * Improved version with better error handling and sync reliability
 */

"use client";

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, Todo, PomodoroSession } from '../lib/database';
import { useLocalCache } from './useLocalCache';
import { dbMonitor } from '../lib/databaseMonitor';

interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingOperations: number;
  syncError: string | null;
}

export function useDataPersistenceEnhanced() {
  const authContext = useAuth();
  const localCache = useLocalCache();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: false,
    lastSync: null,
    pendingOperations: 0,
    syncError: null
  });

  const isAuthenticated = authContext?.user !== null && authContext?.isConfigured;

  // Monitor connection status
  useEffect(() => {
    const checkConnection = async () => {
      const result = await dbMonitor.testConnection();
      setSyncStatus(prev => ({
        ...prev,
        isOnline: result.success,
        syncError: result.error || null
      }));
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const syncLocalDataToDatabase = useCallback(async () => {
    if (!isAuthenticated || !syncStatus.isOnline) return;

    try {
      setSyncStatus(prev => ({ ...prev, pendingOperations: prev.pendingOperations + 1 }));

      // Sync pomodoro sessions from local cache
      const localSessions = localCache.getPomodoroSessions();
      for (const session of localSessions) {
        try {
          await db.savePomodoroSession({
            user_id: authContext?.user?.id,
            email: authContext?.user?.email,
            duration: session.duration,
            type: session.type,
            completed: session.completed,
            created_at: session.created_at,
            completed_at: session.completed_at,
            category: session.category
          });
        } catch (error) {
          console.error('Failed to sync pomodoro session:', error);
        }
      }

      // Clear local cache after successful sync
      localCache.clearLocalData();
      
      setSyncStatus(prev => ({
        ...prev,
        lastSync: new Date(),
        syncError: null
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      setSyncStatus(prev => ({
        ...prev,
        syncError: errorMessage
      }));
    } finally {
      setSyncStatus(prev => ({ ...prev, pendingOperations: Math.max(0, prev.pendingOperations - 1) }));
    }
  }, [isAuthenticated, syncStatus.isOnline, authContext?.user, localCache]);

  // Sync local data when user authenticates
  useEffect(() => {
    if (isAuthenticated && syncStatus.isOnline) {
      syncLocalDataToDatabase();
    }
  }, [isAuthenticated, syncStatus.isOnline, syncLocalDataToDatabase]);

  // Enhanced todo operations with fallback
  const saveTodoEnhanced = useCallback(async (todo: Todo) => {
    if (isAuthenticated && syncStatus.isOnline) {
      try {
        const result = await db.saveTodo({
          ...todo,
          user_id: authContext?.user?.id,
          email: authContext?.user?.email
        });
        
        if (result) {
          return result;
        }
      } catch (error) {
        console.error('Database save failed, using database fallback:', error);
      }
    }
    
    // Fallback: still try database but without auth requirements
    try {
      return await db.saveTodo(todo);
    } catch (error) {
      console.error('Todo save completely failed:', error);
      return null;
    }
  }, [isAuthenticated, syncStatus.isOnline, authContext?.user]);

  const loadTodosEnhanced = useCallback(async (): Promise<Todo[]> => {
    if (isAuthenticated && syncStatus.isOnline) {
      try {
        const dbTodos = await db.getTodos();
        if (dbTodos && dbTodos.length >= 0) {
          return dbTodos;
        }
      } catch (error) {
        console.error('Database load failed:', error);
      }
    }
    
    // Fallback to empty array
    return [];
  }, [isAuthenticated, syncStatus.isOnline]);

  const savePomodoroSessionEnhanced = useCallback(async (session: Partial<PomodoroSession>) => {
    if (isAuthenticated && syncStatus.isOnline) {
      try {
        const result = await db.savePomodoroSession({
          ...session,
          user_id: authContext?.user?.id,
          email: authContext?.user?.email
        });
        
        if (result) {
          return result;
        }
      } catch (error) {
        console.error('Database save failed, falling back to local cache:', error);
      }
    }
    
    // Fallback to local cache
    return localCache.savePomodoroSession({
      id: Date.now().toString(),
      duration: session.duration || 0,
      type: session.type || 'work',
      completed: session.completed || false,
      created_at: session.created_at || new Date().toISOString(),
      completed_at: session.completed_at || new Date().toISOString(),
      category: (session.category as 'Studying' | 'Coding' | 'Writing' | 'Working' | 'Other') || 'Studying'
    });
  }, [isAuthenticated, syncStatus.isOnline, authContext?.user, localCache]);

  // Retry failed operations
  const retrySync = useCallback(async () => {
    if (isAuthenticated) {
      await syncLocalDataToDatabase();
    }
  }, [isAuthenticated, syncLocalDataToDatabase]);

  // Force full sync
  const forceSync = useCallback(async () => {
    if (isAuthenticated && syncStatus.isOnline) {
      setSyncStatus(prev => ({ ...prev, syncError: null }));
      await syncLocalDataToDatabase();
    }
  }, [isAuthenticated, syncStatus.isOnline, syncLocalDataToDatabase]);

  return {
    // Enhanced operations
    saveTodo: saveTodoEnhanced,
    loadTodos: loadTodosEnhanced,
    savePomodoroSession: savePomodoroSessionEnhanced,
    
    // Sync utilities
    syncStatus,
    syncLocalData: syncLocalDataToDatabase,
    retrySync,
    forceSync,
    
    // Status
    isAuthenticated,
    isOnline: syncStatus.isOnline,
    hasPendingSync: syncStatus.pendingOperations > 0,
    lastSyncTime: syncStatus.lastSync,
    syncError: syncStatus.syncError
  };
}
