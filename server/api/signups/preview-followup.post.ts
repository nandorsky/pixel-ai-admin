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
    config.public.supabaseKey as string
  )

  const { data: signup, error } = await supabase
    .from('signups')
    .select('id, email, first_name')
    .eq('id', id)
    .single()

  if (error || !signup) {
    throw createError({ statusCode: 404, statusMessage: 'Signup not found' })
  }

  const subject = `Your Pixel invite expires soon`
  const html = replaceFollowUpPlaceholders(buildFollowUpTemplate(), {
    firstName: signup.first_name || ''
  })

  return { subject, html }
})
