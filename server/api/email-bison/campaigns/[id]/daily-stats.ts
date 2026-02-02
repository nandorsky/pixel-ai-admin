export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  const query = getQuery(event)

  // Default to last 30 days if no dates provided
  const today = new Date()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const startDate = query.start_date || thirtyDaysAgo.toISOString().split('T')[0]
  const endDate = query.end_date || today.toISOString().split('T')[0]

  const url = `https://send.patent355.com/api/campaigns/${id}/line-area-chart-stats?start_date=${startDate}&end_date=${endDate}`

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
      statusMessage: error.message || 'Failed to fetch daily stats'
    })
  }
})
