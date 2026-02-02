export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const params = new URLSearchParams()

  if (query.search) params.append('search', String(query.search))
  if (query.status) params.append('status', String(query.status))
  if (query.folder) params.append('folder', String(query.folder))
  if (query.read !== undefined) params.append('read', String(query.read))
  if (query.campaign_id) params.append('campaign_id', String(query.campaign_id))

  const url = `https://send.patent355.com/api/replies${params.toString() ? `?${params.toString()}` : ''}`

  try {
    const response = await $fetch(url, {
      headers: {
        'Authorization': `Bearer ${config.emailBisonApiKey}`,
        'Accept': 'application/json'
      }
    })
    return response
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch replies from Email Bison'
    })
  }
})
