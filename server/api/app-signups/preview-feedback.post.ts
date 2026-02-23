import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const id = body?.id
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id is required' })
  }

  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceRoleKey as string
  )

  const { data: signup, error } = await supabase
    .from('app_signups')
    .select('id, json_payload, linkedin_json')
    .eq('id', id)
    .single()

  if (error || !signup) {
    throw createError({ statusCode: 404, statusMessage: 'Signup not found' })
  }

  const firstName = signup.linkedin_json?.firstName
    || signup.json_payload?.name?.split(' ')[0]
    || ''

  const subject = 'Quick chat about your Pixel experience?'
  const html = replaceFeedbackPlaceholders(buildFeedbackTemplate(), {
    firstName
  })

  return { subject, html }
})
