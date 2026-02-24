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
    // Get Pixel emails from app_signups, excluding test users
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

    // Search Stripe for each email, 5 at a time with delay
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    const customerIdToEmail: Record<string, string> = {}

    for (let i = 0; i < pixelEmails.length; i += 5) {
      const batch = pixelEmails.slice(i, i + 5)
      const results = await Promise.all(
        batch.map(async (email) => {
          try {
            const result = await $fetch<any>(
              `${baseUrl}/customers/search?query=email:'${email}'`,
              { headers }
            )
            return (result.data || []).map((c: any) => ({ id: c.id, email: email }))
          } catch (err: any) {
            console.error(`Stripe search failed for ${email}:`, err?.data?.error?.message || err?.message)
            return []
          }
        })
      )
      for (const group of results) {
        for (const c of group) {
          customerIdToEmail[c.id] = c.email
        }
      }
      if (i + 5 < pixelEmails.length) {
        await delay(300)
      }
    }

    const customerIds = new Set(Object.keys(customerIdToEmail))
    if (customerIds.size === 0) {
      return { spendByEmail: {} }
    }

    // Fetch charges, only track matched customers
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

    return { spendByEmail: result }
  } catch (error: any) {
    console.error('Stripe spend-by-email error:', error?.data || error?.message)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error?.data?.error?.message || error.message || 'Failed to fetch Stripe data'
    })
  }
})
