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

export interface PomodoroStats {
  id?: number;
  user_id: string;
  date: string;
  category: string;
  pomodoro_count: number;
  total_focus_time_minutes: number;
  created_at?: string;
  updated_at?: string;
  username?: string;
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

export interface ChatMessage {
  id?: string;
  user_id: string;
  username: string;
  message: string;
  created_at?: string;
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
        // No authenticated user found for loading todos
        return [];
      }

      // Loading todos for user

      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (error) {
        console.error('Database error while loading todos:', error);
        throw error;
      }
      
      // Todos loaded successfully from database
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
        // No authenticated user found for saving todo
        return null;
      }

      // Saving todo for user

      const todoData = {
        ...todo,
        user_id: user.id,
        email: user.email
      };

      // Prepared todo data for database

      const { data, error } = await supabase
        .from('todos')
        .insert([todoData])
        .select()
        .single();

      if (error) {
        console.error('Database error while saving todo:', error);
        throw error;
      }
      
      // Todo saved successfully to database
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
        // No authenticated user found for updating todo
        return null;
      }

      // Updating todo for user

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
      
      // Todo updated successfully in database
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
        // No authenticated user found for deleting todo
        return false;
      }

      // Deleting todo for user

      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Database error while deleting todo:', error);
        throw error;
      }
      
      // Todo deleted successfully from database
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
  async updatePomodoroStats(stats: PomodoroStats): Promise<boolean> {
    try {
      const user = await this.checkAuth();
      if (!user) {
        // No authenticated user found for updating Pomodoro stats
        return false;
      }

      // Updating Pomodoro stats for user

      const today = new Date().toISOString().split('T')[0];
      const category = stats.category || 'Other';
      
      // First, check if the user has a username in any pomodoro_stats records
      const { data: userWithUsername } = await supabase
        .from('pomodoro_stats')
        .select('username')
        .eq('user_id', user.id)
        .not('username', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      
      let username = stats.username;
      if (!username && userWithUsername?.username) {
        username = userWithUsername.username;
      }
      
      // Next, try to get existing stats for today and category
      const { data: existingStats } = await supabase
        .from('pomodoro_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .eq('category', category)
        .single();

      if (existingStats) {
        // Found existing stats, updating
        // Update existing stats
        const { error } = await supabase
          .from('pomodoro_stats')
          .update({
            pomodoro_count: (existingStats.pomodoro_count || 0) + (stats.pomodoro_count || 1),
            total_focus_time_minutes: (existingStats.total_focus_time_minutes || 0) + (stats.total_focus_time_minutes || 0),
            updated_at: new Date().toISOString(),
            // Preserve existing username if available
            username: username || existingStats.username
          })
          .eq('id', existingStats.id);

        if (error) {
          console.error('❌ Error updating existing stats:', error);
          throw error;
        }
        // Successfully updated existing Pomodoro stats
      } else {
        // No existing stats found, creating new record
        // Create new stats record
        const { error } = await supabase
          .from('pomodoro_stats')
          .insert([{
            user_id: user.id,
            date: today,
            category: category,
            pomodoro_count: stats.pomodoro_count || 1,
            total_focus_time_minutes: stats.total_focus_time_minutes || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            username: username // Include username if available
          }]);

        if (error) {
          console.error('❌ Error creating new stats:', error);
          throw error;
        }
        // Successfully created new Pomodoro stats record
      }

      return true;
    } catch (error) {
      console.error('❌ Error updating pomodoro stats:', error);
      return false;
    }
  }

  async getPomodoroStats(userId: string, days?: number): Promise<PomodoroStats[]> {
    try {
      if (!userId) {
        console.error('getPomodoroStats called without a userId');
        return [];
      }

      let query = supabase
        .from('pomodoro_stats')
        .select('*')
        .eq('user_id', userId)
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
    id: string;
    email: string;
    totalSessions: number;
    totalFocusTime: number;
    rank: number;
  }>> {
    try {
      // Get aggregated stats for all users
      const { data: statsData, error: statsError } = await supabase
        .from('pomodoro_stats')
        .select('user_id, pomodoro_count, total_focus_time_minutes, date')
        .order('pomodoro_count', { ascending: false });

      if (statsError) throw statsError;

      // Aggregate by user and calculate totals
      const userStats = new Map<string, { 
        id: string; 
        sessions: number; 
        focusTime: number;
      }>();
      
      statsData?.forEach(stat => {
        const userId = stat.user_id;
        
        if (!userStats.has(userId)) {
          userStats.set(userId, {
            id: userId,
            sessions: 0,
            focusTime: 0
          });
        }

        const userStat = userStats.get(userId)!;
        userStat.sessions += stat.pomodoro_count || 0;
        userStat.focusTime += stat.total_focus_time_minutes || 0;
      });

      // Convert to leaderboard format and sort
      const leaderboard = Array.from(userStats.entries())
        .map(([userId, stats]) => ({
          id: userId,
          email: `User #${userId.slice(-4)}`,
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
        });

      // Add rank
      leaderboard.forEach((entry, index) => {
        entry.rank = index + 1;
      });

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
        // No authenticated user found for loading appointments
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
        // No authenticated user found for saving appointment
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
        // No authenticated user found for updating appointment
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
        // No authenticated user found for deleting appointment
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

  // Chat related functions
  async getChatMessages(limit = 50): Promise<ChatMessage[]> {
    try {
      await this.checkAuth();
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error fetching chat messages:', error);
        return [];
      }
      
      return data?.reverse() || [];
    } catch (error) {
      console.error('Failed to fetch chat messages:', error);
      return [];
    }
  }

  async sendChatMessage(message: Omit<ChatMessage, 'id' | 'created_at'>): Promise<ChatMessage | null> {
    try {
      await this.checkAuth();
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([message])
        .select()
        .single();
      
      if (error) {
        console.error('Error sending chat message:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Failed to send chat message:', error);
      return null;
    }
  }
}

// Export singleton instance
export const db = new DatabaseService();
