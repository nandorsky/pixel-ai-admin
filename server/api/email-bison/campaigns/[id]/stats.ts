export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  const body = await readBody(event).catch(() => ({}))

  // Default to last 365 days if no dates provided
  const today = new Date()
  const yearAgo = new Date()
  yearAgo.setFullYear(yearAgo.getFullYear() - 1)

  const startDate = body.start_date || yearAgo.toISOString().split('T')[0]
  const endDate = body.end_date || today.toISOString().split('T')[0]

  const url = `https://send.patent355.com/api/campaigns/${id}/stats`

  try {
    const response = await $fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.emailBisonApiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: {
        start_date: startDate,
        end_date: endDate
      }
    })
    return response
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch campaign stats'
    })
  }
})
