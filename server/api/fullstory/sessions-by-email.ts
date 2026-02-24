export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.fullstoryApiKey as string
  const body = await readBody(event)

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'FULLSTORY_API_KEY not configured'
    })
  }

  const emails: string[] = body?.emails
  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'emails[] is required' })
  }

  const baseUrl = 'https://api.fullstory.com'
  const headers = {
    'Authorization': `Basic ${apiKey}`,
    'Accept': 'application/json'
  }

  const batchSize = 10
  const sessionsByEmail: Record<string, { sessionId: string; createdTime: number; fsUrl: string }[]> = {}

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize)
    const results = await Promise.all(batch.map(async (email) => {
      try {
        const sessions = await $fetch<any[]>(
          `${baseUrl}/api/v1/sessions?email=${encodeURIComponent(email)}`,
          { headers }
        )
        return { email, sessions }
      } catch {
        return { email, sessions: [] }
      }
    }))

    for (const { email, sessions } of results) {
      if (Array.isArray(sessions) && sessions.length > 0) {
        sessionsByEmail[email.toLowerCase()] = sessions.map((s: any) => ({
          sessionId: String(s.SessionId),
          createdTime: s.CreatedTime,
          fsUrl: s.FsUrl
        }))
      }
    }
  }

  return { sessionsByEmail }
})
