import { createClient } from '@supabase/supabase-js'

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

    console.log(`=== STRIPE: Looking up ${pixelEmails.length} Pixel emails ===`)

    // Step 2: Look up each email in Stripe (search API is fast per-email)
    const customers: any[] = []

    // Batch in parallel, 20 at a time to avoid rate limits
    for (let i = 0; i < pixelEmails.length; i += 20) {
      const batch = pixelEmails.slice(i, i + 20)
      const results = await Promise.all(
        batch.map(async (email) => {
          try {
            const result = await $fetch<any>(
              `${baseUrl}/customers/search?query=email:'${email}'`,
              { headers }
            )
            return result.data || []
          } catch {
            return []
          }
        })
      )
      for (const group of results) {
        customers.push(...group)
      }
    }

    console.log(`Found ${customers.length} Stripe customers`)

    // Step 3: Get charges for matched customer IDs only
    const customerIds = new Set(customers.map((c: any) => c.id))
    const chargesByCustomer: Record<string, number> = {}

    if (customerIds.size > 0) {
      let hasMore = true
      let startingAfter: string | undefined
      let pages = 0

      while (hasMore && pages < 5) {
        const params = new URLSearchParams({ limit: '100', 'created[gte]': '1739836800' })
        if (startingAfter) params.append('starting_after', startingAfter)

        const chargeResult = await $fetch<any>(`${baseUrl}/charges?${params}`, { headers })
        pages++
        for (const charge of (chargeResult.data || [])) {
          if (charge.status === 'succeeded' && customerIds.has(charge.customer)) {
            chargesByCustomer[charge.customer] = (chargesByCustomer[charge.customer] || 0) + (charge.amount || 0)
          }
        }
        hasMore = chargeResult.has_more
        if (chargeResult.data?.length) {
          startingAfter = chargeResult.data[chargeResult.data.length - 1].id
        }
      }
    }

    // Map customers
    const mapped = customers
      .filter((c: any) => c.email)
      .map((c: any) => ({
        id: c.id,
        email: c.email,
        name: c.name || null,
        totalSpend: (chargesByCustomer[c.id] || 0) / 100,
        created: c.created
      }))
      .sort((a: any, b: any) => b.created - a.created)

    const totalRevenue = mapped.reduce((sum: number, c: any) => sum + c.totalSpend, 0)

    console.log('=== STRIPE: Done ===')

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
