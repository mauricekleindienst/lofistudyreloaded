-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.appointments (
  id integer NOT NULL DEFAULT nextval('appointments_id_seq'::regclass),
  user_id uuid NOT NULL,
  email character varying NOT NULL,
  title character varying NOT NULL,
  description text,
  date date NOT NULL,
  time time without time zone,
  color character varying DEFAULT '#ff7b00'::character varying,
  category character varying DEFAULT 'personal'::character varying CHECK (category::text = ANY (ARRAY['personal'::text, 'work'::text, 'health'::text, 'study'::text, 'other'::text])),
  reminder boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.backgrounds (
  id integer NOT NULL DEFAULT nextval('backgrounds_id_seq'::regclass),
  name character varying NOT NULL,
  url text NOT NULL,
  thumbnail text,
  category character varying,
  premium boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT backgrounds_pkey PRIMARY KEY (id)
);
CREATE TABLE public.challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  reward text NOT NULL,
  total integer NOT NULL,
  type text NOT NULL,
  category text NOT NULL,
  tracking_type text NOT NULL,
  time_requirement jsonb,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT challenges_pkey PRIMARY KEY (id)
);
CREATE TABLE public.events (
  id integer NOT NULL DEFAULT nextval('events_id_seq'::regclass),
  email character varying NOT NULL,
  title character varying NOT NULL,
  date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.feedback (
  id integer NOT NULL DEFAULT nextval('feedback_id_seq'::regclass),
  email character varying NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'reviewed'::text, 'responded'::text])),
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  response text,
  user_id uuid,
  CONSTRAINT feedback_pkey PRIMARY KEY (id),
  CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.flashcards (
  id integer NOT NULL DEFAULT nextval('flashcards_id_seq'::regclass),
  email character varying NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  color character varying DEFAULT '#ff7b00'::character varying,
  image_url text,
  completed boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  last_reviewed timestamp without time zone,
  next_review timestamp without time zone,
  review_count integer DEFAULT 0,
  user_id uuid,
  CONSTRAINT flashcards_pkey PRIMARY KEY (id),
  CONSTRAINT flashcards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.notes (
  id integer NOT NULL DEFAULT nextval('notes_id_seq'::regclass),
  email character varying NOT NULL,
  title character varying NOT NULL,
  content text NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT notes_pkey PRIMARY KEY (id),
  CONSTRAINT notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.pomodoro_sessions (
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
CREATE TABLE public.pomodoro_stats (
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
CREATE TABLE public.progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL,
  challenge_id uuid,
  progress integer NOT NULL,
  completed boolean DEFAULT false,
  completed_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT progress_pkey PRIMARY KEY (id),
  CONSTRAINT progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT progress_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id)
);
CREATE TABLE public.subtasks (
  id integer NOT NULL DEFAULT nextval('subtasks_id_seq'::regclass),
  todo_id integer,
  text text NOT NULL,
  completed boolean DEFAULT false,
  CONSTRAINT subtasks_pkey PRIMARY KEY (id),
  CONSTRAINT subtasks_todo_id_fkey FOREIGN KEY (todo_id) REFERENCES public.todos(id)
);
CREATE TABLE public.todos (
  id integer NOT NULL DEFAULT nextval('todos_id_seq'::regclass),
  email character varying NOT NULL,
  text text NOT NULL,
  completed boolean DEFAULT false,
  position integer,
  color character varying DEFAULT '#ff7b00'::character varying,
  user_id uuid,
  priority character varying DEFAULT 'medium'::character varying CHECK (priority::text = ANY (ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying]::text[])),
  category character varying DEFAULT 'work'::character varying CHECK (category::text = ANY (ARRAY['work'::character varying, 'personal'::character varying, 'study'::character varying, 'health'::character varying]::text[])),
  due_date timestamp with time zone,
  CONSTRAINT todos_pkey PRIMARY KEY (id),
  CONSTRAINT todos_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.tracks (
  id integer NOT NULL DEFAULT nextval('tracks_id_seq'::regclass),
  user_email character varying NOT NULL,
  title character varying NOT NULL,
  video_id character varying NOT NULL,
  user_id uuid,
  CONSTRAINT tracks_pkey PRIMARY KEY (id),
  CONSTRAINT tracks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.tutorial_state (
  id integer NOT NULL DEFAULT nextval('tutorial_state_id_seq'::regclass),
  email character varying NOT NULL,
  tutorial text NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT tutorial_state_pkey PRIMARY KEY (id),
  CONSTRAINT tutorial_state_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email character varying NOT NULL UNIQUE,
  full_name character varying,
  avatar_url text,
  premium boolean DEFAULT false,
  streak_count integer DEFAULT 0,
  total_focus_time integer DEFAULT 0,
  settings jsonb DEFAULT '{}'::jsonb,
  last_active timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);