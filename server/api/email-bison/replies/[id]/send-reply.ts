export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)

  const url = `https://send.patent355.com/api/replies/${id}/reply`

  try {
    const response = await $fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.emailBisonApiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: {
        reply_all: true,
        message: body.message,
        reply_template_id: body.reply_template_id || undefined,
        inject_previous_email_body: body.inject_previous_email_body ?? true,
        content_type: body.content_type || 'html'
      }
    })
    return response
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to send reply'
    })
  }
})
