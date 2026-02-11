import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.public.supabaseKey as string
  )

  const { data: signups, error } = await supabase
    .from('signups')
    .select('created_at')
    .order('created_at', { ascending: true })

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  const total = signups?.length || 0
  const target = 1000

  if (total === 0) {
    return { total, target, daysRemaining: null, projectedDate: null }
  }

  // Calculate daily signups over different periods
  const now = new Date()
  const signupDates = signups.map(s => new Date(s.created_at))
  const firstSignup = signupDates[0]
  const daysSinceStart = Math.max(1, Math.floor((now.getTime() - firstSignup.getTime()) / (1000 * 60 * 60 * 24)))

  // Last 7 days
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const last7Days = signupDates.filter(d => d >= sevenDaysAgo).length

  // Last 14 days
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const last14Days = signupDates.filter(d => d >= fourteenDaysAgo).length

  // Last 30 days
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const last30Days = signupDates.filter(d => d >= thirtyDaysAgo).length

  const avgPerDay7 = last7Days / 7
  const avgPerDay14 = last14Days / 14
  const avgPerDay30 = last30Days / 30
  const avgPerDayAllTime = total / daysSinceStart

  const remaining = target - total

  // Use weighted average favoring recent data
  const weightedAvg = (avgPerDay7 * 3 + avgPerDay14 * 2 + avgPerDay30 * 1) / 6

  const daysToTarget7 = remaining > 0 && avgPerDay7 > 0 ? Math.ceil(remaining / avgPerDay7) : null
  const daysToTarget14 = remaining > 0 && avgPerDay14 > 0 ? Math.ceil(remaining / avgPerDay14) : null
  const daysToTarget30 = remaining > 0 && avgPerDay30 > 0 ? Math.ceil(remaining / avgPerDay30) : null
  const daysToTargetWeighted = remaining > 0 && weightedAvg > 0 ? Math.ceil(remaining / weightedAvg) : null

  const projectedDate = daysToTargetWeighted
    ? new Date(now.getTime() + daysToTargetWeighted * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    : null

  // Daily breakdown for last 14 days
  const dailyBreakdown: { date: string; count: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const dayStart = new Date(now)
    dayStart.setDate(dayStart.getDate() - i)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const count = signupDates.filter(d => d >= dayStart && d < dayEnd).length
    dailyBreakdown.push({
      date: dayStart.toISOString().split('T')[0],
      count
    })
  }

  return {
    total,
    target,
    remaining,
    daysSinceStart,
    rates: {
      last7Days: { signups: last7Days, perDay: Math.round(avgPerDay7 * 100) / 100 },
      last14Days: { signups: last14Days, perDay: Math.round(avgPerDay14 * 100) / 100 },
      last30Days: { signups: last30Days, perDay: Math.round(avgPerDay30 * 100) / 100 },
      allTime: { perDay: Math.round(avgPerDayAllTime * 100) / 100 }
    },
    projections: {
      basedOn7Days: daysToTarget7,
      basedOn14Days: daysToTarget14,
      basedOn30Days: daysToTarget30,
      weighted: daysToTargetWeighted,
      projectedDate
    },
    dailyBreakdown
  }
})
