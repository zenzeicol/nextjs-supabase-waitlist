// Marks this module as server-only: if it is ever imported from a Client
// Component, the build fails instead of dragging the Supabase client (and its
// configuration) into the browser bundle.
import 'server-only'

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.local.'
  )
}

/**
 * Client shared by the two Server Actions: the waitlist
 * (lib/waitlist-action.ts) and the account deletion request
 * (lib/account-deletion.ts).
 *
 * It uses the anon key, never service_role. Both tables it touches are set up
 * the same way (see supabase/migrations): anon only has INSERT, never SELECT.
 * That is why no insert from this client may chain .select(): reading back the
 * freshly written row fails with 42501. See "Why INSERT-only RLS" in the README.
 */
export const supabase = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
