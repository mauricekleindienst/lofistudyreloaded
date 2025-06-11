const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function runMigration() {
  try {
    console.log('Running migration to add missing columns to todos table...');
    
    // Add priority column
    const { error: priorityError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));`
    });
    
    if (priorityError && !priorityError.message.includes('already exists')) {
      console.error('Error adding priority column:', priorityError);
    } else {
      console.log('✓ Priority column added/exists');
    }
    
    // Add category column
    const { error: categoryError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS category VARCHAR(20) DEFAULT 'work' CHECK (category IN ('work', 'personal', 'study', 'health'));`
    });
    
    if (categoryError && !categoryError.message.includes('already exists')) {
      console.error('Error adding category column:', categoryError);
    } else {
      console.log('✓ Category column added/exists');
    }
    
    // Add due_date column
    const { error: dueDateError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE public.todos ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;`
    });
    
    if (dueDateError && !dueDateError.message.includes('already exists')) {
      console.error('Error adding due_date column:', dueDateError);
    } else {
      console.log('✓ Due date column added/exists');
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

runMigration();
