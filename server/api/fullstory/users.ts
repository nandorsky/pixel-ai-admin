export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.fullstoryApiKey as string

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'FULLSTORY_API_KEY not configured'
    })
  }

  const baseUrl = 'https://api.fullstory.com'
  const headers = {
    'Authorization': `Basic ${apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }

  const allUsers: any[] = []
  let pageToken: string | null = null

  do {
    const url = pageToken
      ? `${baseUrl}/v2/users?limit=25&page_token=${pageToken}`
      : `${baseUrl}/v2/users?limit=25`

    const data = await $fetch<any>(url, { headers })
    allUsers.push(...(data.results || []))
    pageToken = data.next_page_token || null
  } while (pageToken)

  // Filter to Pixel AI users only
  const pixelUsers = allUsers.filter(u => u.properties?.accountPlanLevel === 'PIXEL_AI')

  // Fetch sessions in parallel batches of 20
  const batchSize = 20

  async function fetchSessions(u: any): Promise<any[]> {
    try {
      const lookup = u.uid
        ? `uid=${u.uid}`
        : u.email
          ? `email=${encodeURIComponent(u.email)}`
          : null
      if (!lookup) return []
      return await $fetch<any[]>(`${baseUrl}/api/v1/sessions?${lookup}`, { headers })
    } catch {
      return []
    }
  }

  const usersWithSessions: any[] = []

  for (let i = 0; i < pixelUsers.length; i += batchSize) {
    const batch = pixelUsers.slice(i, i + batchSize)
    const sessionResults = await Promise.all(batch.map(fetchSessions))

    for (let j = 0; j < batch.length; j++) {
      const u = batch[j]
      const sessions = Array.isArray(sessionResults[j]) ? sessionResults[j] : []
      usersWithSessions.push({
        id: u.id,
        uid: u.uid,
        displayName: u.display_name || null,
        email: u.email || null,
        accountStatus: u.properties?.accountStatus || null,
        accountName: u.properties?.accountName || null,
        role: u.properties?.role || null,
        appUrl: u.app_url || null,
        sessions: sessions.map((s: any) => ({
          sessionId: s.SessionId,
          createdTime: s.CreatedTime,
          fsUrl: s.FsUrl
        }))
      })
    }
  }

  return { users: usersWithSessions, total: usersWithSessions.length }
})
