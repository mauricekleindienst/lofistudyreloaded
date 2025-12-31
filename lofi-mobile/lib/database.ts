import { supabase } from './supabase';

// Types for our database entities
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

// Database service class
export class DatabaseService {
  // Check if user is authenticated
  private async checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
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
      // Don't filter out streak_count and total_focus_time if we want to update them
      // But usually these are updated via specific logic. 
      // If we want to allow updating them here, we should include them.
      // The previous code filtered them out: const { streak_count, total_focus_time, ...validUpdates } = updates;
      // Let's allow updating them if passed, as they are part of the profile.
      
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
        .upsert([{
          ...userProfile,
          updated_at: new Date().toISOString()
        }], { onConflict: 'id' });

      if (error) {
        // console.error('Error creating user profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      return false;
    }
  }

  // Todo operations
  async getTodos(): Promise<Todo[]> {
    try {
      const user = await this.checkAuth();
      if (!user) return [];

      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching todos:', error);
      return [];
    }
  }

  async saveTodo(todo: Todo): Promise<Todo | null> {
    try {
      const user = await this.checkAuth();
      if (!user) return null;

      const todoData = {
        ...todo,
        user_id: user.id,
        email: user.email
      };

      const { data, error } = await supabase
        .from('todos')
        .insert([todoData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving todo:', error);
      return null;
    }
  }

  async updateTodo(id: number, updates: Partial<Todo>): Promise<Todo | null> {
    try {
      const user = await this.checkAuth();
      if (!user) return null;

      const { data, error } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating todo:', error);
      return null;
    }
  }

  async deleteTodo(id: number): Promise<boolean> {
    try {
      const user = await this.checkAuth();
      if (!user) return false;

      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting todo:', error);
      return false;
    }
  }

  // Stats operations
  async logPomodoroSession(durationMinutes: number, category: string = 'Studying'): Promise<boolean> {
    try {
      const user = await this.checkAuth();
      if (!user) return false;

      // 1. Log the session in pomodoro_stats table
      const { error: statsError } = await supabase
        .from('pomodoro_stats')
        .insert([{
          user_id: user.id,
          total_focus_time_minutes: durationMinutes,
          pomodoro_count: 1,
          category: category,
          completed_at: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
          username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
        }]);

      if (statsError) {
        console.error('Error logging session:', statsError);
        // Continue anyway to try updating user profile
      }

      // 2. Update user profile totals
      // We need to fetch current totals first or use a stored procedure increment if available.
      // For now, let's fetch and update.
      const profile = await this.getUserProfile(user.id);
      if (profile) {
        const newTotalTime = (profile.total_focus_time || 0) + durationMinutes;
        
        // Simple streak logic: check if last_active was yesterday
        const today = new Date().toISOString().split('T')[0];
        const lastActive = profile.last_active ? profile.last_active.split('T')[0] : null;
        
        let newStreak = profile.streak_count || 0;
        
        if (lastActive !== today) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];
            
            if (lastActive === yesterdayStr) {
                newStreak += 1;
            } else {
                newStreak = 1; // Reset streak if missed a day (or first day)
            }
        }

        await this.updateUserProfile(user.id, {
            total_focus_time: newTotalTime,
            streak_count: newStreak,
            last_active: new Date().toISOString()
        });
      }

      return true;
    } catch (error) {
      console.error('Error logging pomodoro:', error);
      return false;
    }
  }
}

// Export singleton instance
export const db = new DatabaseService();
