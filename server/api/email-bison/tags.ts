export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const url = 'https://send.patent355.com/api/tags'

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
      statusMessage: error.message || 'Failed to fetch tags from Email Bison'
    })
  }
})
