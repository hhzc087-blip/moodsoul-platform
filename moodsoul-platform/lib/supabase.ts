import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if environment variables are set and not default placeholders
const isConfigured = supabaseUrl && 
                     supabaseUrl !== 'your_supabase_url' && 
                     supabaseUrl.startsWith('http');

if (!isConfigured) {
  console.warn('⚠️ Supabase is not configured. Check your .env.local file.');
}

// Export a client. If not configured, we create a client with dummy values to prevent crash,
// but actual calls will fail gracefully or need to be handled.
// Note: We use a valid-looking dummy URL to satisfy the library's validation if real one is missing.
export const supabase = createClient(
  isConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co',
  isConfigured ? supabaseKey : 'placeholder-key'
)
