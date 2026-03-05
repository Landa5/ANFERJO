import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    'https://ugaxfpqzkudqbeisavny.supabase.co',
    'sb_publishable_upn8dhWYMEq9rQgk01YGhg_S-LkYFF5'
  )
}
