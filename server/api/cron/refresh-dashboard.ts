import { createClient } from '@supabase/supabase-js'
import { computeDashboardData } from '../dashboard/stats'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Optional: verify cron secret for security
  const authHeader = getHeader(event, 'authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceRoleKey as string
  )

  const data = await computeDashboardData(config)

  await supabase
    .from('dashboard_cache')
    .upsert({
      id: 'dashboard_v1',
      data,
      updated_at: new Date().toISOString()
    })

  return { success: true, computedAt: data.computedAt }
})
