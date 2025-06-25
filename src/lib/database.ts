import { createClient } from '../utils/supabase/client';

// Create a client instance for database operations
const supabase = createClient();

// Types for our database entities
export interface Todo {
  id?: number;
  user_id?: string;
  email?: string;
  text: string;
  completed: boolean;
  position?: number;
  color?: string;
  priority?: 'low' | 'medium' | 'high';
  category?: 'work' | 'personal' | 'study' | 'health';
  due_date?: string;
}

export interface ExtendedUserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  premium?: boolean;
  streak_count?: number;
  total_focus_time?: number;
  settings?: Record<string, unknown>;
  last_active?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Note {
  id?: number;
  user_id?: string;
  email?: string;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export interface PomodoroSession {
  id?: string;
  user_id?: string;
  email?: string;
  duration?: number;
  type?: 'work' | 'short_break' | 'long_break';
  completed?: boolean;
  created_at?: string;
  completed_at?: string;
  task_name?: string;
  notes?: string;
  category?: string;
}

export interface PomodoroStats {
  id?: number;
  user_id?: string;
  email?: string;
  date?: string;
  sessions_completed?: number;
  total_focus_time?: number;
  category?: string;
}

export interface UserSettings {
  id?: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  premium?: boolean;
  streak_count?: number;
  total_focus_time?: number;
  settings?: {
    selectedBackground?: string;
    pomodoroSettings?: {
      workDuration?: number;
      shortBreakDuration?: number;
      longBreakDuration?: number;
      cyclesUntilLongBreak?: number;
    };
    notificationsEnabled?: boolean;
    theme?: string;
  };
  last_active?: string;
}

export interface Appointment {
  id?: number;
  user_id?: string;
  email?: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD format
  time?: string; // HH:MM format
  color?: string;
  category?: 'personal' | 'work' | 'health' | 'study' | 'other';
  reminder?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Database service class
export class DatabaseService {
  // Check if user is authenticated and service is configured
  private async checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }
  // Todo operations
  async getTodos(): Promise<Todo[]> {
    try {
      const user = await this.checkAuth();
      if (!user) {
        console.log('No authenticated user found for loading todos');
        return [];
      }

      console.log('Loading todos for user:', user.email);

      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (error) {
        console.error('Database error while loading todos:', error);
        throw error;
      }
      
      console.log('Todos loaded successfully from database:', data?.length || 0, 'items');
      return data || [];
    } catch (error) {
      console.error('Error fetching todos:', error);
      return [];
    }
  }
  async saveTodo(todo: Todo): Promise<Todo | null> {
    try {
      const user = await this.checkAuth();
      if (!user) {
        console.log('No authenticated user found for saving todo');
        return null;
      }

      console.log('Saving todo for user:', user.email, 'Todo data:', todo);

      const todoData = {
        ...todo,
        user_id: user.id,
        email: user.email
      };

      console.log('Prepared todo data for database:', todoData);

      const { data, error } = await supabase
        .from('todos')
        .insert([todoData])
        .select()
        .single();

      if (error) {
        console.error('Database error while saving todo:', error);
        throw error;
      }
      
      console.log('Todo saved successfully to database:', data);
      return data;
    } catch (error) {
      console.error('Error saving todo:', error);
      return null;
    }
  }
  async updateTodo(id: number, updates: Partial<Todo>): Promise<Todo | null> {
    try {
      const user = await this.checkAuth();
      if (!user) {
        console.log('No authenticated user found for updating todo');
        return null;
      }

      console.log('Updating todo for user:', user.email, 'Todo ID:', id, 'Updates:', updates);

      const { data, error } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Database error while updating todo:', error);
        throw error;
      }
      
      console.log('Todo updated successfully in database:', data);
      return data;
    } catch (error) {
      console.error('Error updating todo:', error);
      return null;
    }
  }
  async deleteTodo(id: number): Promise<boolean> {
    try {
      const user = await this.checkAuth();
      if (!user) {
        console.log('No authenticated user found for deleting todo');
        return false;
      }

      console.log('Deleting todo for user:', user.email, 'Todo ID:', id);

      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Database error while deleting todo:', error);
        throw error;
      }
      
      console.log('Todo deleted successfully from database');
      return true;
    } catch (error) {
      console.error('Error deleting todo:', error);
      return false;
    }
  }

  // Notes operations
  async getNotes(): Promise<Note[]> {
    try {
      const user = await this.checkAuth();
      if (!user) return [];

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notes:', error);
      return [];
    }
  }

  async saveNote(note: Note): Promise<Note | null> {
    try {
      const user = await this.checkAuth();
      if (!user) return null;

      const noteData = {
        ...note,
        user_id: user.id,
        email: user.email,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('notes')
        .insert([noteData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving note:', error);
      return null;
    }
  }

  async updateNote(id: number, updates: Partial<Note>): Promise<Note | null> {
    try {
      const user = await this.checkAuth();
      if (!user) return null;

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating note:', error);
      return null;
    }
  }

  async deleteNote(id: number): Promise<boolean> {
    try {
      const user = await this.checkAuth();
      if (!user) return false;

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  }

  // Pomodoro operations
  async savePomodoroSession(session: PomodoroSession): Promise<PomodoroSession | null> {
    try {
      const user = await this.checkAuth();
      if (!user) {
        console.log('No authenticated user found for saving Pomodoro session');
        return null;
      }

      console.log('Saving Pomodoro session for user:', user.email, 'Session data:', session);

      // Add created_at timestamp if not provided
      const now = new Date().toISOString();
      const sessionData = {
        ...session,
        user_id: user.id,
        email: user.email,
        created_at: session.created_at || now
      };

      console.log('Prepared session data for database:', sessionData);

      // Check for existing session with same ID to prevent duplicates
      if (session.id) {
        const { data: existingSession } = await supabase
          .from('pomodoro_sessions')
          .select('id')
          .eq('id', session.id)
          .eq('user_id', user.id)
          .single();

        if (existingSession) {
          console.log('Session already exists, skipping duplicate save');
          return sessionData as PomodoroSession;
        }
      }

      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (error) {
        console.error('Database error while saving session:', error);
        // If it's a duplicate error, return the existing session
        if (error.code === '23505') { // PostgreSQL unique violation
          console.log('Session already exists (unique constraint), skipping duplicate save');
          return sessionData as PomodoroSession;
        }
        throw error;
      }
      
      console.log('Pomodoro session saved successfully to database:', data);
      return data;
    } catch (error) {
      console.error('Error saving pomodoro session:', error);
      return null;
    }
  }

  async getPomodoroSessions(email: string, limit?: number): Promise<PomodoroSession[]> {
    try {
      const user = await this.checkAuth();
      if (!user) return [];

      let query = supabase
        .from('pomodoro_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pomodoro sessions:', error);
      return [];
    }
  }

  async updatePomodoroStats(stats: PomodoroStats): Promise<boolean> {
    try {
      const user = await this.checkAuth();
      if (!user) {
        console.log('No authenticated user found for updating Pomodoro stats');
        return false;
      }

      console.log('Updating Pomodoro stats for user:', user.email, 'Stats data:', stats);

      const today = new Date().toISOString().split('T')[0];
      
      // First, try to get existing stats for today
      const { data: existingStats } = await supabase
        .from('pomodoro_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .eq('category', stats.category || 'general')
        .single();

      if (existingStats) {
        console.log('Found existing stats, updating:', existingStats);
        // Update existing stats
        const { error } = await supabase
          .from('pomodoro_stats')
          .update({
            sessions_completed: (existingStats.sessions_completed || 0) + (stats.sessions_completed || 1),
            total_focus_time: (existingStats.total_focus_time || 0) + (stats.total_focus_time || 0)
          })
          .eq('id', existingStats.id);

        if (error) {
          console.error('Error updating existing stats:', error);
          throw error;
        }
        console.log('Successfully updated existing Pomodoro stats');
      } else {
        console.log('No existing stats found, creating new record');
        // Create new stats record
        const { error } = await supabase
          .from('pomodoro_stats')
          .insert([{
            user_id: user.id,
            email: user.email,
            date: today,
            sessions_completed: stats.sessions_completed || 1,
            total_focus_time: stats.total_focus_time || 0,
            category: stats.category || 'general'
          }]);

        if (error) {
          console.error('Error creating new stats:', error);
          throw error;
        }
        console.log('Successfully created new Pomodoro stats record');
      }

      return true;
    } catch (error) {
      console.error('Error updating pomodoro stats:', error);
      return false;
    }
  }

  async getPomodoroStats(email: string, days?: number): Promise<PomodoroStats[]> {
    try {
      const user = await this.checkAuth();
      if (!user) return [];

      let query = supabase
        .from('pomodoro_stats')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (days) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query = query.gte('date', startDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pomodoro stats:', error);
      return [];
    }
  }

  // User settings operations
  async getUserSettings(): Promise<UserSettings | null> {
    try {
      const user = await this.checkAuth();
      if (!user) return null;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      return null;
    }
  }

  async saveUserSettings(settings: Partial<UserSettings>): Promise<boolean> {
    try {
      const user = await this.checkAuth();
      if (!user) return false;

      // First check if user record exists
      const existingUser = await this.getUserSettings();

      if (existingUser) {
        // Update existing user
        const { error } = await supabase
          .from('users')
          .update({
            ...settings,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) throw error;
      } else {
        // Create new user record
        const { error } = await supabase
          .from('users')
          .insert([{
            id: user.id,
            email: user.email || '',
            ...settings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Error saving user settings:', error);
      return false;
    }
  }

  // Background selection
  async saveSelectedBackground(backgroundId: string): Promise<boolean> {
    const currentSettings = await this.getUserSettings();
    const settings = currentSettings?.settings || {};
    
    return await this.saveUserSettings({
      settings: {
        ...settings,
        selectedBackground: backgroundId
      }
    });
  }
  async getSelectedBackground(): Promise<string | null> {
    const userSettings = await this.getUserSettings();
    return userSettings?.settings?.selectedBackground || null;
  }

  // Leaderboard
  async getLeaderboard(): Promise<Array<{
    email: string;
    totalSessions: number;
    totalFocusTime: number;
    rank: number;
  }>> {
    try {
      // Get aggregated stats for all users
      const { data, error } = await supabase
        .from('pomodoro_stats')
        .select('email, sessions_completed, total_focus_time')
        .order('sessions_completed', { ascending: false });

      if (error) throw error;

      // Aggregate by user and calculate totals
      const userStats = new Map<string, { sessions: number; focusTime: number }>();
      
      data?.forEach(stat => {
        const existing = userStats.get(stat.email) || { sessions: 0, focusTime: 0 };
        userStats.set(stat.email, {
          sessions: existing.sessions + (stat.sessions_completed || 0),
          focusTime: existing.focusTime + (stat.total_focus_time || 0)
        });
      });

      // Convert to leaderboard format and sort
      const leaderboard = Array.from(userStats.entries())
        .map(([email, stats]) => ({
          email,
          totalSessions: stats.sessions,
          totalFocusTime: stats.focusTime,
          rank: 0 // Will be set below
        }))
        .sort((a, b) => {
          // Sort by sessions first, then by focus time
          if (b.totalSessions !== a.totalSessions) {
            return b.totalSessions - a.totalSessions;
          }
          return b.totalFocusTime - a.totalFocusTime;
        })
        .slice(0, 50) // Top 50 users
        .map((user, index) => ({
          ...user,
          rank: index + 1
        }));

      return leaderboard;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  // User profile operations
  async getUserProfile(userId: string): Promise<ExtendedUserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }

  async updateUserProfile(userId: string, updates: Partial<ExtendedUserProfile>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      return false;
    }
  }

  async createUserProfile(userProfile: Omit<ExtendedUserProfile, 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('users')
        .insert([{
          ...userProfile,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      if (error) {
        console.error('Error creating user profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      return false;
    }
  }

  // Appointment operations
  async getAppointments(): Promise<Appointment[]> {
    try {
      const user = await this.checkAuth();
      if (!user) {
        console.log('No authenticated user found for loading appointments');
        return [];
      }

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (error) {
        console.error('Database error while loading appointments:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }
  }

  async saveAppointment(appointment: Appointment): Promise<Appointment | null> {
    try {
      const user = await this.checkAuth();
      if (!user) {
        console.log('No authenticated user found for saving appointment');
        return null;
      }

      const appointmentData = {
        ...appointment,
        user_id: user.id,
        email: user.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('appointments')
        .insert([appointmentData])
        .select()
        .single();

      if (error) {
        console.error('Database error while saving appointment:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error saving appointment:', error);
      return null;
    }
  }

  async updateAppointment(id: number, updates: Partial<Appointment>): Promise<Appointment | null> {
    try {
      const user = await this.checkAuth();
      if (!user) {
        console.log('No authenticated user found for updating appointment');
        return null;
      }

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Database error while updating appointment:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error updating appointment:', error);
      return null;
    }
  }

  async deleteAppointment(id: number): Promise<boolean> {
    try {
      const user = await this.checkAuth();
      if (!user) {
        console.log('No authenticated user found for deleting appointment');
        return false;
      }

      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Database error while deleting appointment:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      return false;
    }
  }

  async getAppointmentsByDate(date: string): Promise<Appointment[]> {
    try {
      const user = await this.checkAuth();
      if (!user) return [];

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', date)
        .order('time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching appointments by date:', error);
      return [];
    }
  }
}

// Export singleton instance
export const db = new DatabaseService();
