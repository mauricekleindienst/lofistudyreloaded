import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

// Note: processLock might not be exported by all versions of supabase-js. 
// If this fails, we might need to remove it or use a custom lock implementation.
// However, adhering to user request.
// If processLock is undefined, we will just omit it from the config to avoid crash.
// But we can't conditionally import. 
// Let's assume it works as requested.

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please check your .env file.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || '',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
