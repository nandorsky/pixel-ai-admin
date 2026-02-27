import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  const ids: number[] = body?.ids
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ids[] is required'
    })
  }

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
  const resend = new Resend(config.resendApiKey as string)
  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.supabaseServiceRoleKey as string
  )

  const template = body.htmlTemplate || buildFeedbackTemplate()
  const subject = body.subject || 'Quick chat about your Pixel experience?'
  const results: { id: number; status: string; error?: string }[] = []

  for (const id of ids) {
    const { data: signup, error: fetchError } = await supabase
      .from('app_signups')
      .select('id, json_payload, linkedin_json, feedback_request')
      .eq('id', id)
      .single()

    if (fetchError || !signup) {
      results.push({ id, status: 'error', error: fetchError?.message || 'Not found' })
      continue
    }

    if (signup.feedback_request) {
      results.push({ id, status: 'already_sent' })
      continue
    }

    const email = signup.json_payload?.email
    if (!email) {
      results.push({ id, status: 'error', error: 'No email found' })
      continue
    }

    const firstName = signup.linkedin_json?.firstName
      || signup.json_payload?.name?.split(' ')[0]
      || ''

    const html = replaceFeedbackPlaceholders(template, { firstName })

    try {
      const resendResponse = await resend.emails.send({
        from: 'Pixel <notifications@notifications.getpixel.ai>',
        replyTo: 'internal@getpixel.ai',
        to: email,
        subject,
        html
      })

      if (resendResponse.error) {
        results.push({ id, status: 'error', error: resendResponse.error.message })
        continue
      }

      if (!resendResponse.data?.id) {
        results.push({ id, status: 'error', error: 'Resend returned no email ID' })
        continue
      }

      const { data: updateData, error: updateError } = await supabase
        .from('app_signups')
        .update({ feedback_request: new Date().toISOString() })
        .eq('id', id)
        .select('id')

      if (updateError) {
        results.push({ id, status: 'error', error: `Email sent but failed to update record: ${updateError.message}` })
      } else if (!updateData || updateData.length === 0) {
        results.push({ id, status: 'error', error: 'Email sent but feedback_request not updated (RLS may be blocking updates)' })
      } else {
        results.push({ id, status: 'sent' })
      }
    } catch (err: any) {
      results.push({ id, status: 'error', error: err.message || 'Failed to send email' })
    }

    // Rate limit: Resend allows 2 requests/sec
    await delay(600)
  }

  return { results }
})
