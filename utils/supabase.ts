import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

export function useSupabase() {
  if (supabaseInstance) return supabaseInstance

  const config = useRuntimeConfig()

  supabaseInstance = createClient(
    config.public.supabaseUrl as string,
    config.public.supabaseKey as string,
    {
      auth: {
        persistSession: true,
        storageKey: 'pixel-auth',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  )

  return supabaseInstance
}
