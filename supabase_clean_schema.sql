-- Updated Supabase schema with clean Pomodoro tracking
-- This reflects the corrected database structure

-- Keep existing tables (backgrounds, challenges, events, feedback, flashcards, notes, progress, subtasks, todos, tracks, tutorial_state, users)

-- POMODORO TRACKING TABLES (Updated)

-- Individual pomodoro sessions table
CREATE TABLE public.pomodoro_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email character varying NOT NULL,
  duration integer DEFAULT 1500, -- Duration in seconds (25 minutes = 1500 seconds)
  type text DEFAULT 'work'::text CHECK (type = ANY (ARRAY['work'::text, 'short_break'::text, 'long_break'::text])),
  completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  task_name text,
  notes text,
  category character varying, -- 'Studying', 'Coding', 'Writing', 'Working', 'Other'
  CONSTRAINT pomodoro_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT pomodoro_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Daily aggregated stats table
CREATE TABLE public.pomodoro_stats (
  id integer NOT NULL DEFAULT nextval('pomodoro_stats_id_seq'::regclass),
  user_id uuid,
  email character varying NOT NULL,
  date date DEFAULT CURRENT_DATE,
  sessions_completed integer DEFAULT 0, -- Number of completed work sessions
  total_focus_time integer DEFAULT 0, -- Total focus time in seconds
  category character varying, -- 'Studying', 'Coding', 'Writing', 'Working', 'Other'
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pomodoro_stats_pkey PRIMARY KEY (id),
  CONSTRAINT pomodoro_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- REMOVED: user_pomodoros table (was redundant and unused)

-- Performance indexes
CREATE INDEX idx_pomodoro_sessions_user_date ON public.pomodoro_sessions(user_id, created_at);
CREATE INDEX idx_pomodoro_sessions_completed_at ON public.pomodoro_sessions(completed_at) WHERE completed = true;
CREATE INDEX idx_pomodoro_stats_user_date_category ON public.pomodoro_stats(user_id, date, category);

-- Row Level Security
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own sessions" ON public.pomodoro_sessions USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own stats" ON public.pomodoro_stats USING (auth.uid() = user_id);
