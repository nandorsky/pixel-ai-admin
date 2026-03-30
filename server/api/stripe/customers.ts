import { createClient } from '@supabase/supabase-js'

interface Charge {
  id: string
  amount: number
  currency: string
  status: string
  created: number
  description: string | null
  invoice: string | null
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.stripeSecretKey as string

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'STRIPE_SECRET_KEY not configured'
    })
  }

  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceRoleKey as string
  )

  const baseUrl = 'https://api.stripe.com/v1'
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Stripe-Version': '2024-12-18.acacia'
  }
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  try {
    // Step 1: Get Pixel emails from app_signups, excluding test users
    const [{ data: appSignups }, { data: testUsers }] = await Promise.all([
      supabase.from('app_signups').select('json_payload'),
      supabase.from('test_users').select('email')
    ])

    const suppressedEmails = new Set(
      (testUsers || []).map((r: any) => r.email?.toLowerCase()).filter(Boolean)
    )

    const pixelEmails = [...new Set(
      (appSignups || [])
        .map((r: any) => r.json_payload?.email?.toLowerCase())
        .filter((e: string) => e && !suppressedEmails.has(e) && !e.endsWith('@metadata.io'))
    )]

    // Step 2: Look up each email in Stripe, 10 at a time with retry on rate limit
    const customers: any[] = []

    async function stripeSearchWithRetry(email: string, retries = 3): Promise<any[]> {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          const result = await $fetch<any>(
            `${baseUrl}/customers/search?query=email:'${email}'`,
            { headers }
          )
          return result.data || []
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

    for (let i = 0; i < pixelEmails.length; i += 10) {
      const batch = pixelEmails.slice(i, i + 10)
      const results = await Promise.all(batch.map(email => stripeSearchWithRetry(email)))
      for (const group of results) {
        customers.push(...group)
      }
      if (i + 10 < pixelEmails.length) {
        await delay(100)
      }
    }

    // Step 3: Get all charges and group by customer
    const customerIds = new Set(customers.map((c: any) => c.id))
    const chargesByCustomer: Record<string, Charge[]> = {}

    if (customerIds.size > 0) {
      let hasMore = true
      let startingAfter: string | undefined
      let pages = 0

      while (hasMore && pages < 10) {
        const params = new URLSearchParams({ limit: '100', 'created[gte]': '1739836800' })
        if (startingAfter) params.append('starting_after', startingAfter)

        const chargeResult = await $fetch<any>(`${baseUrl}/charges?${params}`, { headers })
        pages++
        for (const charge of (chargeResult.data || [])) {
          if (charge.status === 'succeeded' && customerIds.has(charge.customer)) {
            if (!chargesByCustomer[charge.customer]) chargesByCustomer[charge.customer] = []
            chargesByCustomer[charge.customer].push({
              id: charge.id,
              amount: charge.amount / 100,
              currency: charge.currency || 'usd',
              status: charge.status,
              created: charge.created,
              description: charge.description || null,
              invoice: charge.invoice || null
            })
          }
        }
        hasMore = chargeResult.has_more
        if (chargeResult.data?.length) {
          startingAfter = chargeResult.data[chargeResult.data.length - 1].id
        }
      }
    }

    // Map customers with their charges
    const mapped = customers
      .filter((c: any) => c.email)
      .map((c: any) => {
        const charges = (chargesByCustomer[c.id] || []).sort((a, b) => b.created - a.created)
        const totalSpend = charges.reduce((sum, ch) => sum + ch.amount, 0)
        const lastChargeAt = charges.length > 0 ? charges[0].created : null
        const firstChargeAt = charges.length > 0 ? charges[charges.length - 1].created : null
        return {
          id: c.id,
          email: c.email,
          name: c.name || null,
          totalSpend,
          chargeCount: charges.length,
          charges,
          lastChargeAt,
          firstChargeAt,
          created: c.created
        }
      })
      .sort((a, b) => (b.lastChargeAt || b.created) - (a.lastChargeAt || a.created))

    const totalRevenue = mapped.reduce((sum, c) => sum + c.totalSpend, 0)

    return {
      customers: mapped,
      total: mapped.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100
    }
  } catch (error: any) {
    console.error('Stripe API error:', error?.data || error?.message)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error?.data?.error?.message || error.message || 'Failed to fetch Stripe data'
    })
  }
})
