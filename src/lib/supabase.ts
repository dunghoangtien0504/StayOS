import { createClient } from '@supabase/supabase-js'

// Fallback URL is a valid-format placeholder so createClient doesn't throw
// at module-import time during Next.js SSG build when env vars are absent.
// At runtime on VPS, .env.local always has the real values baked in.
// Use || (not ??) — Next.js replaces missing NEXT_PUBLIC_ vars with '' at build
// time, and '' ?? fallback returns '' while '' || fallback returns the fallback.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
)
