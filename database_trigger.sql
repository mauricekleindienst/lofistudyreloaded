-- SUPABASE DATABASE SETUP FOR OAUTH FIX
-- Run these commands in your Supabase SQL Editor to fix OAuth user creation issues

-- 1. Create the trigger function to automatically create user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create profile if it doesn't already exist
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = NEW.id) THEN
    INSERT INTO public.users (id, email, full_name, avatar_url, premium, streak_count, total_focus_time, settings)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
      COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
      false,
      0,
      0,
      '{}'::jsonb
    );
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE WARNING 'Failed to create user profile for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Enable RLS on users table (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated insert" ON public.users;

-- 5. Create comprehensive RLS policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Allow inserts for authenticated users (for the trigger and manual creation)
CREATE POLICY "Allow authenticated insert" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

-- 6. Grant necessary permissions
-- Grant usage on the schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant permissions on the users table
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

-- Grant permissions on sequences (for other tables)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 7. Test the setup (optional - run this to verify everything works)
-- You can run this manually to test if the trigger works:
-- SELECT public.handle_new_user() FROM auth.users LIMIT 1;

-- NOTES:
-- 1. This trigger will automatically create a user profile when someone signs up via OAuth
-- 2. The EXCEPTION block ensures that if profile creation fails, the OAuth process still succeeds
-- 3. RLS policies ensure users can only access their own data
-- 4. The service_role has full access for administrative functions
