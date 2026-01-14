import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

export function useSupabase() {
  if (supabaseInstance) return supabaseInstance

  const config = useRuntimeConfig()
  supabaseInstance = createClient(
    config.public.supabaseUrl as string,
    config.public.supabaseKey as string
  )

  return supabaseInstance
}
