export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const url = `https://send.patent355.com/api/replies/${id}/mark-as-read-or-unread`

  try {
    const response = await $fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${config.emailBisonApiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: {
        read: body.read ?? true
      }
    })
    return response
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to mark reply as read/unread'
    })
  }
})
