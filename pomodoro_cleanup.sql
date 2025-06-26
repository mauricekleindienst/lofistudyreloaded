-- Clean up unused Pomodoro tables and optimize the schema
-- Run this on your Supabase database

-- Drop the old unused user_pomodoros table
-- (Make sure to backup any important data first!)
DROP TABLE IF EXISTS public.user_pomodoros;

-- Ensure pomodoro_sessions table has the correct structure
-- (This is just for verification - the table should already exist)
/*
CREATE TABLE IF NOT EXISTS public.pomodoro_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email character varying NOT NULL,
  duration integer DEFAULT 1500,
  type text DEFAULT 'work'::text CHECK (type = ANY (ARRAY['work'::text, 'short_break'::text, 'long_break'::text])),
  completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  task_name text,
  notes text,
  category character varying,
  CONSTRAINT pomodoro_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT pomodoro_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
*/

-- Ensure pomodoro_stats table has the correct structure
-- (This is just for verification - the table should already exist)
/*
CREATE TABLE IF NOT EXISTS public.pomodoro_stats (
  id integer NOT NULL DEFAULT nextval('pomodoro_stats_id_seq'::regclass),
  user_id uuid,
  email character varying NOT NULL,
  date date DEFAULT CURRENT_DATE,
  sessions_completed integer DEFAULT 0,
  total_focus_time integer DEFAULT 0,
  category character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pomodoro_stats_pkey PRIMARY KEY (id),
  CONSTRAINT pomodoro_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
*/

-- Create index for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user_date 
ON public.pomodoro_sessions(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_completed_at 
ON public.pomodoro_sessions(completed_at) WHERE completed = true;

CREATE INDEX IF NOT EXISTS idx_pomodoro_stats_user_date_category 
ON public.pomodoro_stats(user_id, date, category);

-- Enable RLS (Row Level Security) for both tables
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_stats ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for pomodoro_sessions
CREATE POLICY "Users can view their own sessions" ON public.pomodoro_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON public.pomodoro_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON public.pomodoro_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for pomodoro_stats
CREATE POLICY "Users can view their own stats" ON public.pomodoro_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" ON public.pomodoro_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats" ON public.pomodoro_stats
  FOR UPDATE USING (auth.uid() = user_id);
