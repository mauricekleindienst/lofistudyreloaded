-- Create sequence for appointments table first
CREATE SEQUENCE IF NOT EXISTS public.appointments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Create appointments table for calendar functionality
CREATE TABLE public.appointments (
  id integer NOT NULL DEFAULT nextval('appointments_id_seq'::regclass),
  user_id uuid NOT NULL,
  email character varying NOT NULL,
  title character varying NOT NULL,
  description text,
  date date NOT NULL,
  time time,
  color character varying DEFAULT '#ff7b00',
  category character varying DEFAULT 'personal' CHECK (category = ANY (ARRAY['personal', 'work', 'health', 'study', 'other'])),
  reminder boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Set sequence ownership
ALTER SEQUENCE public.appointments_id_seq OWNED BY public.appointments.id;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_user_date ON public.appointments(user_id, date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own appointments" ON public.appointments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appointments" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments" ON public.appointments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments" ON public.appointments
  FOR DELETE USING (auth.uid() = user_id);

-- Create trigger function for updating updated_at column
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_appointments_updated_at();
