export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')

  const url = `https://send.patent355.com/api/replies/${id}/mark-as-interested`

  try {
    const response = await $fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${config.emailBisonApiKey}`,
        'Accept': 'application/json'
      }
    })
    return response
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to mark as interested'
    })
  }
})
