import { createClient } from '@supabase/supabase-js'

interface DashboardData {
  signups: any[]
  activeEmails: string[]
  stripeSpend: Record<string, number>
  recentTraces: any[]
  tracesByEmail: Record<string, number>
  traceDaysByEmail: Record<string, string[]> // email -> array of unique YYYY-MM-DD dates
  computedAt: string
}

const CACHE_KEY = 'dashboard_v1'
const CACHE_TTL_MS = 3 * 60 * 60 * 1000 // 3 hours

function getSupabase(config: any) {
  return createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceRoleKey as string
  )
}

async function fetchAllTraces(config: any): Promise<{
  activeEmails: string[]
  recentTraces: any[]
  tracesByEmail: Record<string, number>
  traceDaysByEmail: Record<string, string[]>
}> {
  const emails = new Set<string>()
  const tracesByEmail: Record<string, number> = {}
  const traceDaysSet: Record<string, Set<string>> = {} // email -> Set of YYYY-MM-DD
  let recentTraces: any[] = []
  let page = 1
  const size = 200
  let total = 0

  do {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
      project_name: 'Pixel AI',
      truncate: 'false'
    })

    const result = await $fetch<any>(`https://www.comet.com/opik/api/v1/private/traces?${params}`, {
      headers: {
        'Comet-Workspace': config.opikWorkspace as string,
        'authorization': config.opikApiKey as string
      }
    })

    total = result.total || 0

    if (page === 1) {
      recentTraces = (result.content || []).slice(0, 10)
    }

    for (const trace of (result.content || [])) {
      const email = (trace.metadata?.user_email || trace.metadata?.user_meail || '').toLowerCase()
      if (email) {
        emails.add(email)
        tracesByEmail[email] = (tracesByEmail[email] || 0) + 1

        // Track which days this user was active
        const traceDate = trace.start_time || trace.created_at
        if (traceDate) {
          const day = traceDate.slice(0, 10) // YYYY-MM-DD
          if (!traceDaysSet[email]) traceDaysSet[email] = new Set()
          traceDaysSet[email].add(day)
        }
      }
    }
    page++
  } while ((page - 1) * size < total)

  // Convert Sets to sorted arrays for JSON serialization
  const traceDaysByEmail: Record<string, string[]> = {}
  for (const [email, days] of Object.entries(traceDaysSet)) {
    traceDaysByEmail[email] = [...days].sort()
  }

  return { activeEmails: [...emails], recentTraces, tracesByEmail, traceDaysByEmail }
}

async function fetchStripeSpend(config: any, pixelEmails: string[]): Promise<Record<string, number>> {
  const apiKey = config.stripeSecretKey as string
  if (!apiKey) return {}

  const baseUrl = 'https://api.stripe.com/v1'
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Stripe-Version': '2024-12-18.acacia'
  }

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  async function stripeSearchWithRetry(email: string, retries = 3): Promise<{ id: string; email: string }[]> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const result = await $fetch<any>(
          `${baseUrl}/customers/search?query=email:'${email}'`,
          { headers }
        )
        return (result.data || []).map((c: any) => ({ id: c.id, email }))
      } catch (err: any) {
        const status = err?.statusCode || err?.status || err?.data?.error?.status
        if (status === 429 && attempt < retries - 1) {
          await delay(1000 * (attempt + 1))
          continue
        }
        return []
      }
    }
    return []
  }

  const customerIdToEmail: Record<string, string> = {}
  for (let i = 0; i < pixelEmails.length; i += 10) {
    const batch = pixelEmails.slice(i, i + 10)
    const results = await Promise.all(batch.map(email => stripeSearchWithRetry(email)))
    for (const group of results) {
      for (const c of group) {
        customerIdToEmail[c.id] = c.email
      }
    }
    if (i + 10 < pixelEmails.length) await delay(100)
  }

  const customerIds = new Set(Object.keys(customerIdToEmail))
  if (customerIds.size === 0) return {}

  const spendByEmail: Record<string, number> = {}
  let hasMore = true
  let startingAfter: string | undefined
  let pages = 0

  while (hasMore && pages < 10) {
    const params = new URLSearchParams({ limit: '100', 'created[gte]': '1739836800' })
    if (startingAfter) params.append('starting_after', startingAfter)

    const result = await $fetch<any>(`${baseUrl}/charges?${params}`, { headers })
    pages++
    for (const charge of (result.data || [])) {
      if (charge.status === 'succeeded' && customerIds.has(charge.customer)) {
        const email = customerIdToEmail[charge.customer]
        spendByEmail[email] = (spendByEmail[email] || 0) + (charge.amount || 0)
      }
    }
    hasMore = result.has_more
    if (result.data?.length) {
      startingAfter = result.data[result.data.length - 1].id
    }
  }

  // Convert cents to dollars
  const result: Record<string, number> = {}
  for (const [email, cents] of Object.entries(spendByEmail)) {
    result[email] = Math.round(cents) / 100
  }
  return result
}

export async function computeDashboardData(config: any): Promise<DashboardData> {
  const supabase = getSupabase(config)

  // Fetch app signups + test users
  const [signupsResult, testUsersResult] = await Promise.all([
    supabase
      .from('app_signups')
      .select('id, created_at, json_payload, linkedin_json')
      .order('created_at', { ascending: false }),
    supabase
      .from('test_users')
      .select('email')
  ])

  const suppressedEmails = new Set(
    (testUsersResult.data || []).map((r: any) => r.email?.toLowerCase()).filter(Boolean)
  )

  const signups = (signupsResult.data || []).filter((s: any) => {
    const email = s.json_payload?.email?.toLowerCase()
    return !email || (!suppressedEmails.has(email) && !email.endsWith('@metadata.io'))
  })

  const pixelEmails = [...new Set(
    signups
      .map((s: any) => s.json_payload?.email?.toLowerCase())
      .filter(Boolean)
  )]

  // Fetch traces and stripe in parallel
  let traceData = {
    activeEmails: [] as string[],
    recentTraces: [] as any[],
    tracesByEmail: {} as Record<string, number>,
    traceDaysByEmail: {} as Record<string, string[]>
  }
  let stripeSpend: Record<string, number> = {}

  try {
    const [t, s] = await Promise.all([
      fetchAllTraces(config).catch(() => ({
        activeEmails: [], recentTraces: [], tracesByEmail: {}, traceDaysByEmail: {}
      })),
      fetchStripeSpend(config, pixelEmails).catch(() => ({}))
    ])
    traceData = t
    stripeSpend = s
  } catch {
    // Continue with empty data if APIs fail
  }

  return {
    signups,
    activeEmails: traceData.activeEmails,
    stripeSpend,
    recentTraces: traceData.recentTraces,
    tracesByEmail: traceData.tracesByEmail,
    traceDaysByEmail: traceData.traceDaysByEmail,
    computedAt: new Date().toISOString()
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabase = getSupabase(config)

  // Check cache (gracefully skip if table doesn't exist)
  try {
    const { data: cached, error } = await supabase
      .from('dashboard_cache')
      .select('data, updated_at')
      .eq('id', CACHE_KEY)
      .single()

    if (!error && cached?.data && cached.updated_at) {
      const age = Date.now() - new Date(cached.updated_at).getTime()
      if (age < CACHE_TTL_MS) {
        return { ...cached.data, fromCache: true, cachedAt: cached.updated_at }
      }
    }
  } catch {
    // Cache table may not exist yet — continue to live compute
  }

  // Cache is stale, missing, or table doesn't exist — recompute
  const data = await computeDashboardData(config)

  // Try to store in cache (ignore errors if table doesn't exist)
  try {
    await supabase
      .from('dashboard_cache')
      .upsert({
        id: CACHE_KEY,
        data,
        updated_at: new Date().toISOString()
      })
  } catch {
    // Cache table may not exist — that's fine
  }

  return { ...data, fromCache: false, cachedAt: data.computedAt }
})
