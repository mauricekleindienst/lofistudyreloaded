"use client";

import { useState } from 'react';

export interface LocalPomodoroSession {
  id: string;
  duration: number;
  type: 'work' | 'short_break' | 'long_break';
  completed: boolean;
  category: 'Studying' | 'Coding' | 'Writing' | 'Working' | 'Other';
  completed_at: string;
  created_at: string;
}

export interface LocalPomodoroStats {
  totalSessions: number;
  totalMinutes: number;
  sessionsToday: number;
  minutesToday: number;
  currentStreak: number;
  bestStreak: number;
  categoryCounts: Record<string, number>;
}

export function useLocalCache() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to safely access localStorage
  const safeLocalStorage = {
    getItem: (key: string): string | null => {
      try {
        return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      } catch (error) {
        console.warn('localStorage getItem failed:', error);
        return null;
      }
    },
    setItem: (key: string, value: string): void => {
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(key, value);
        }
      } catch (error) {
        console.warn('localStorage setItem failed:', error);
      }
    },
    removeItem: (key: string): void => {
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(key);
        }
      } catch (error) {
        console.warn('localStorage removeItem failed:', error);
      }
    }
  };

  // Get today's date string for filtering
  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Save Pomodoro session to localStorage
  const savePomodoroSession = async (session: LocalPomodoroSession): Promise<LocalPomodoroSession | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const existingSessions = getPomodoroSessions();
      const updatedSessions = [...existingSessions, session];
        safeLocalStorage.setItem('pomodoro_sessions', JSON.stringify(updatedSessions));
      
      // Update stats
      await updatePomodoroStats();
      
      return session;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save session';
      setError(errorMessage);
      console.error('Local cache save error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get all Pomodoro sessions from localStorage
  const getPomodoroSessions = (): LocalPomodoroSession[] => {
    try {
      const sessionsData = safeLocalStorage.getItem('pomodoro_sessions');
      return sessionsData ? JSON.parse(sessionsData) : [];
    } catch (error) {
      console.warn('Failed to parse stored sessions:', error);
      return [];
    }
  };

  // Get Pomodoro statistics
  const getPomodoroStats = (): LocalPomodoroStats => {
    try {
      const sessions = getPomodoroSessions();
      const today = getTodayString();
      
      const completedSessions = sessions.filter(s => s.completed && s.type === 'work');
      const todaySessions = completedSessions.filter(s => 
        s.completed_at.startsWith(today)
      );

      const totalMinutes = completedSessions.reduce((total, session) => 
        total + Math.floor(session.duration / 60), 0
      );
      
      const minutesToday = todaySessions.reduce((total, session) => 
        total + Math.floor(session.duration / 60), 0
      );

      // Calculate category counts
      const categoryCounts: Record<string, number> = {};
      completedSessions.forEach(session => {
        categoryCounts[session.category] = (categoryCounts[session.category] || 0) + 1;
      });

      // Calculate streak (simplified - consecutive days with sessions)
      const currentStreak = calculateCurrentStreak(sessions);
      const bestStreak = calculateBestStreak(sessions);

      return {
        totalSessions: completedSessions.length,
        totalMinutes,
        sessionsToday: todaySessions.length,
        minutesToday,
        currentStreak,
        bestStreak,
        categoryCounts
      };
    } catch (error) {
      console.warn('Failed to calculate stats:', error);
      return {
        totalSessions: 0,
        totalMinutes: 0,
        sessionsToday: 0,
        minutesToday: 0,
        currentStreak: 0,
        bestStreak: 0,
        categoryCounts: {}
      };
    }
  };  // Update statistics after completing a session
  const updatePomodoroStats = async (): Promise<void> => {
    // Stats are calculated dynamically in getPomodoroStats, so no need to store them separately
    return Promise.resolve();
  };

  // Calculate current streak
  const calculateCurrentStreak = (sessions: LocalPomodoroSession[]): number => {
    const completedSessions = sessions
      .filter(s => s.completed && s.type === 'work')
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());

    if (completedSessions.length === 0) return 0;    const today = new Date();
    // eslint-disable-next-line prefer-const
    let currentDate = new Date(today);
    let streak = 0;

    for (let i = 0; i < 30; i++) { // Check last 30 days
      const dateString = currentDate.toISOString().split('T')[0];
      const hasSessionOnDate = completedSessions.some(s => 
        s.completed_at.startsWith(dateString)
      );

      if (hasSessionOnDate) {
        streak++;
      } else if (streak > 0) {
        break; // Streak broken
      }

      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  };

  // Calculate best streak
  const calculateBestStreak = (sessions: LocalPomodoroSession[]): number => {
    const completedSessions = sessions
      .filter(s => s.completed && s.type === 'work')
      .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());

    if (completedSessions.length === 0) return 0;

    let maxStreak = 0;
    let currentStreak = 0;
    let lastDate: string | null = null;

    completedSessions.forEach(session => {
      const sessionDate = session.completed_at.split('T')[0];
      
      if (lastDate) {
        const lastDateTime = new Date(lastDate + 'T00:00:00');
        const sessionDateTime = new Date(sessionDate + 'T00:00:00');
        const daysDiff = Math.floor((sessionDateTime.getTime() - lastDateTime.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          currentStreak++;
        } else if (daysDiff > 1) {
          maxStreak = Math.max(maxStreak, currentStreak);
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      
      lastDate = sessionDate;
    });

    return Math.max(maxStreak, currentStreak);
  };

  // Clear all local data
  const clearLocalData = (): void => {
    safeLocalStorage.removeItem('pomodoro_sessions');
    safeLocalStorage.removeItem('pomodoro_stats');
  };

  return {
    isLoading,
    error,
    savePomodoroSession,
    getPomodoroSessions,
    getPomodoroStats,
    clearLocalData
  };
}