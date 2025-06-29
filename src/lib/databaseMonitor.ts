/**
 * Database Sync Monitor
 * Helps identify and debug database connection and sync issues
 */

import { createClient } from '../utils/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export class DatabaseSyncMonitor {
  private supabase = createClient();
  private connectionStatus: 'connected' | 'disconnected' | 'error' = 'disconnected';
  private lastError: string | null = null;

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        this.connectionStatus = 'error';
        this.lastError = error.message;
        return { success: false, error: error.message };
      }

      this.connectionStatus = 'connected';
      this.lastError = null;
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.connectionStatus = 'error';
      this.lastError = errorMessage;
      return { success: false, error: errorMessage };
    }
  }

  async validateTables(): Promise<{ 
    success: boolean; 
    tables: string[]; 
    missing: string[];
    error?: string;
  }> {
    const requiredTables = [
      'users',
      'todos',
      'notes', 
      'pomodoro_sessions',
      'pomodoro_stats',
      'appointments'
    ];

    try {
      // Test each table
      const results = await Promise.allSettled(
        requiredTables.map(async (table) => {
          const { error } = await this.supabase
            .from(table)
            .select('*')
            .limit(1);
          return { table, exists: !error };
        })
      );

      const existingTables: string[] = [];
      const missingTables: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.exists) {
          existingTables.push(result.value.table);
        } else {
          missingTables.push(requiredTables[index]);
        }
      });

      return {
        success: missingTables.length === 0,
        tables: existingTables,
        missing: missingTables
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return {
        success: false,
        tables: [],
        missing: requiredTables,
        error: errorMessage
      };
    }
  }

  async testCRUDOperations(): Promise<{
    success: boolean;
    operations: Record<string, boolean>;
    errors: string[];
  }> {
    const operations: Record<string, boolean> = {};
    const errors: string[] = [];

    try {
      // Test INSERT
      const { data: insertData, error: insertError } = await this.supabase
        .from('todos')
        .insert({
          text: 'Database sync test',
          completed: false,
          email: 'test@example.com'
        })
        .select()
        .single();

      operations.insert = !insertError;
      if (insertError) {
        errors.push(`Insert failed: ${insertError.message}`);
      }

      if (insertData) {
        // Test UPDATE
        const { error: updateError } = await this.supabase
          .from('todos')
          .update({ completed: true })
          .eq('id', insertData.id);

        operations.update = !updateError;
        if (updateError) {
          errors.push(`Update failed: ${updateError.message}`);
        }

        // Test SELECT
        const { data: selectData, error: selectError } = await this.supabase
          .from('todos')
          .select('*')
          .eq('id', insertData.id)
          .single();

        operations.select = !selectError && selectData?.completed === true;
        if (selectError) {
          errors.push(`Select failed: ${selectError.message}`);
        }

        // Test DELETE
        const { error: deleteError } = await this.supabase
          .from('todos')
          .delete()
          .eq('id', insertData.id);

        operations.delete = !deleteError;
        if (deleteError) {
          errors.push(`Delete failed: ${deleteError.message}`);
        }
      }

      return {
        success: Object.values(operations).every(Boolean),
        operations,
        errors
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`CRUD test failed: ${errorMessage}`);
      return {
        success: false,
        operations,
        errors
      };
    }
  }

  async getAuthStatus(): Promise<{
    authenticated: boolean;
    user: User | null;
    session: Session | null;
    error?: string;
  }> {
    try {
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();

      return {
        authenticated: !!user,
        user,
        session,
        error: userError?.message || sessionError?.message
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return {
        authenticated: false,
        user: null,
        session: null,
        error: errorMessage
      };
    }
  }

  async runFullDiagnostic(): Promise<{
    connection: boolean;
    tables: { success: boolean; missing: string[] };
    crud: { success: boolean; errors: string[] };
    auth: { authenticated: boolean; error?: string };
    recommendations: string[];
  }> {
    const [connectionResult, tablesResult, crudResult, authResult] = await Promise.all([
      this.testConnection(),
      this.validateTables(),
      this.testCRUDOperations(),
      this.getAuthStatus()
    ]);

    const recommendations: string[] = [];

    if (!connectionResult.success) {
      recommendations.push('Check your Supabase URL and API key in environment variables');
      recommendations.push('Verify your Supabase project is active and accessible');
    }

    if (tablesResult.missing.length > 0) {
      recommendations.push(`Missing database tables: ${tablesResult.missing.join(', ')}`);
      recommendations.push('Run the SQL schema file to create missing tables');
    }

    if (!crudResult.success) {
      recommendations.push('Database CRUD operations are failing - check RLS policies');
      recommendations.push('Ensure proper permissions are set for authenticated users');
    }

    if (!authResult.authenticated && connectionResult.success) {
      recommendations.push('User is not authenticated - database operations may be restricted');
    }

    return {
      connection: connectionResult.success,
      tables: {
        success: tablesResult.success,
        missing: tablesResult.missing
      },
      crud: {
        success: crudResult.success,
        errors: crudResult.errors
      },
      auth: {
        authenticated: authResult.authenticated,
        error: authResult.error
      },
      recommendations
    };
  }

  getStatus() {
    return {
      connectionStatus: this.connectionStatus,
      lastError: this.lastError
    };
  }
}

// Export singleton instance
export const dbMonitor = new DatabaseSyncMonitor();
