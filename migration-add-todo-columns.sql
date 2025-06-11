-- Add missing columns to todos table
ALTER TABLE public.todos 
ADD COLUMN IF NOT EXISTS priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));

ALTER TABLE public.todos 
ADD COLUMN IF NOT EXISTS category VARCHAR(20) DEFAULT 'work' CHECK (category IN ('work', 'personal', 'study', 'health'));

ALTER TABLE public.todos 
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE;

-- Update any existing todos to have default values
UPDATE public.todos 
SET priority = 'medium' 
WHERE priority IS NULL;

UPDATE public.todos 
SET category = 'work' 
WHERE category IS NULL;
