import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.fullstoryApiKey as string

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'FULLSTORY_API_KEY not configured'
    })
  }

  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceRoleKey as string
  )

  // Get emails from app_signups
  const { data: signups } = await supabase
    .from('app_signups')
    .select('json_payload, linkedin_json')

  const emailUsers = (signups || [])
    .map(s => ({
      email: s.json_payload?.email?.toLowerCase() || '',
      name: [s.linkedin_json?.firstName, s.linkedin_json?.lastName].filter(Boolean).join(' ') || null
    }))
    .filter(u => u.email && !u.email.endsWith('@metadata.io'))

  // Dedupe by email
  const seen = new Set<string>()
  const uniqueUsers = emailUsers.filter(u => {
    if (seen.has(u.email)) return false
    seen.add(u.email)
    return true
  })

  const baseUrl = 'https://api.fullstory.com'
  const headers = {
    'Authorization': `Basic ${apiKey}`,
    'Accept': 'application/json'
  }

  // Fetch sessions in parallel batches of 20
  const batchSize = 20
  const usersWithSessions: any[] = []

  for (let i = 0; i < uniqueUsers.length; i += batchSize) {
    const batch = uniqueUsers.slice(i, i + batchSize)
    const sessionResults = await Promise.all(batch.map(async (u) => {
      try {
        return await $fetch<any[]>(
          `${baseUrl}/api/v1/sessions?email=${encodeURIComponent(u.email)}`,
          { headers }
        )
      } catch {
        return []
      }
    }))

    for (let j = 0; j < batch.length; j++) {
      const u = batch[j]
      const sessions = Array.isArray(sessionResults[j]) ? sessionResults[j] : []
      usersWithSessions.push({
        email: u.email,
        displayName: u.name,
        sessions: sessions.map((s: any) => ({
          sessionId: String(s.SessionId),
          createdTime: s.CreatedTime,
          fsUrl: s.FsUrl
        }))
      })
    }
  }

  return { users: usersWithSessions, total: usersWithSessions.length }
})
