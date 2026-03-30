import { createClient } from '@supabase/supabase-js'
import { computeDashboardData } from './stats'

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceRoleKey as string
  )

  const data = await computeDashboardData(config)

  try {
    await supabase
      .from('dashboard_cache')
      .upsert({
        id: 'dashboard_v1',
        data,
        updated_at: new Date().toISOString()
      })
  } catch {
    // Cache table may not exist yet
  }

  return { success: true, computedAt: data.computedAt }
})
