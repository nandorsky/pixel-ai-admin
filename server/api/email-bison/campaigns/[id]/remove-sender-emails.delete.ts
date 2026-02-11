export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const url = `https://send.patent355.com/api/campaigns/${id}/remove-sender-emails`

  try {
    const response = await $fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${config.emailBisonApiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: {
        sender_email_ids: body.sender_email_ids
      }
    })
    return response
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to remove sender emails from campaign'
    })
  }
})
