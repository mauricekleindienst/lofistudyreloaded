/**
 * Realtime hooks for Supabase subscriptions
 * Provides real-time updates for todos, pomodoro sessions, and stats
 */

"use client";

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '../utils/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { Todo, PomodoroSession, PomodoroStats } from '../lib/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient();

export function useRealtimeTodos() {
  const authContext = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [setChannel] = useState<RealtimeChannel | null>(null);

  // Load initial todos
  const loadTodos = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase.from('todos').select('*').order('position');
      
      if (authContext?.user?.email) {
        query = query.eq('email', authContext.user.email);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error loading todos:', error);
      } else {
        setTodos(data || []);
      }
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [authContext?.user?.email]);

  // Set up realtime subscription
  useEffect(() => {
    if (!authContext?.isConfigured) return;

    loadTodos();

    // Create realtime channel
    const todosChannel = supabase
      .channel('todos_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: authContext?.user?.email ? `email=eq.${authContext.user.email}` : undefined
        },
        (payload) => {
          console.log('Realtime todo change:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              setTodos(prev => [...prev, payload.new as Todo]);
              break;
            case 'UPDATE':
              setTodos(prev => 
                prev.map(todo => 
                  todo.id === payload.new.id ? payload.new as Todo : todo
                )
              );
              break;
            case 'DELETE':
              setTodos(prev => 
                prev.filter(todo => todo.id !== payload.old.id)
              );
              break;
          }
        }
      )
      .subscribe();

    setChannel(todosChannel);

    return () => {
      if (todosChannel) {
        supabase.removeChannel(todosChannel);
      }
    };
  }, [authContext?.isConfigured, authContext?.user?.email, loadTodos]);

  return {
    todos,
    isLoading,
    refresh: loadTodos
  };
}

export function useRealtimePomodoroSessions() {
  const authContext = useAuth();
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [setChannel] = useState<RealtimeChannel | null>(null);

  const loadSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('pomodoro_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (authContext?.user?.email) {
        query = query.eq('email', authContext.user.email);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error loading pomodoro sessions:', error);
      } else {
        setSessions(data || []);
      }
    } catch (error) {
      console.error('Failed to load pomodoro sessions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [authContext?.user?.email]);

  useEffect(() => {
    if (!authContext?.isConfigured) return;

    loadSessions();

    const pomodoroChannel = supabase
      .channel('pomodoro_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pomodoro_sessions',
          filter: authContext?.user?.email ? `email=eq.${authContext.user.email}` : undefined
        },
        (payload) => {
          console.log('Realtime pomodoro session change:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              setSessions(prev => [payload.new as PomodoroSession, ...prev.slice(0, 49)]);
              break;
            case 'UPDATE':
              setSessions(prev => 
                prev.map(session => 
                  session.id === payload.new.id ? payload.new as PomodoroSession : session
                )
              );
              break;
            case 'DELETE':
              setSessions(prev => 
                prev.filter(session => session.id !== payload.old.id)
              );
              break;
          }
        }
      )
      .subscribe();

    setChannel(pomodoroChannel);

    return () => {
      if (pomodoroChannel) {
        supabase.removeChannel(pomodoroChannel);
      }
    };
  }, [authContext?.isConfigured, authContext?.user?.email, loadSessions]);

  return {
    sessions,
    isLoading,
    refresh: loadSessions
  };
}

export function useRealtimePomodoroStats() {
  const authContext = useAuth();
  const [stats, setStats] = useState<PomodoroStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [setChannel] = useState<RealtimeChannel | null>(null);

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from('pomodoro_stats')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);
      
      if (authContext?.user?.email) {
        query = query.eq('email', authContext.user.email);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error loading pomodoro stats:', error);
      } else {
        setStats(data || []);
      }
    } catch (error) {
      console.error('Failed to load pomodoro stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [authContext?.user?.email]);

  useEffect(() => {
    if (!authContext?.isConfigured) return;

    loadStats();

    const statsChannel = supabase
      .channel('pomodoro_stats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pomodoro_stats',
          filter: authContext?.user?.email ? `email=eq.${authContext.user.email}` : undefined
        },
        (payload) => {
          console.log('Realtime pomodoro stats change:', payload);
          
          switch (payload.eventType) {
            case 'INSERT':
              setStats(prev => [payload.new as PomodoroStats, ...prev.slice(0, 29)]);
              break;
            case 'UPDATE':
              setStats(prev => 
                prev.map(stat => 
                  stat.id === payload.new.id ? payload.new as PomodoroStats : stat
                )
              );
              break;
            case 'DELETE':
              setStats(prev => 
                prev.filter(stat => stat.id !== payload.old.id)
              );
              break;
          }
        }
      )
      .subscribe();

    setChannel(statsChannel);

    return () => {
      if (statsChannel) {
        supabase.removeChannel(statsChannel);
      }
    };
  }, [authContext?.isConfigured, authContext?.user?.email, loadStats]);

  return {
    stats,
    isLoading,
    refresh: loadStats
  };
}

// Combined hook for all realtime data
export function useRealtimeData() {
  const todos = useRealtimeTodos();
  const sessions = useRealtimePomodoroSessions();
  const stats = useRealtimePomodoroStats();

  return {
    todos: todos.todos,
    sessions: sessions.sessions,
    stats: stats.stats,
    isLoading: todos.isLoading || sessions.isLoading || stats.isLoading,
    refresh: {
      todos: todos.refresh,
      sessions: sessions.refresh,
      stats: stats.refresh
    }
  };
}
