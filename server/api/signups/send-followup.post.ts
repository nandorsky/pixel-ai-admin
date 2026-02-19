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
    config.public.supabaseKey as string
  )

  const template = body.htmlTemplate || buildFollowUpTemplate()
  const subject = body.subject || 'Your Pixel invite expires soon'
  const results: { id: number; status: string; error?: string }[] = []

  for (const id of ids) {
    const { data: signup, error: fetchError } = await supabase
      .from('signups')
      .select('id, email, first_name, follow_up_sent_at')
      .eq('id', id)
      .single()

    if (fetchError || !signup) {
      results.push({ id, status: 'error', error: fetchError?.message || 'Not found' })
      continue
    }

    if (signup.follow_up_sent_at) {
      results.push({ id, status: 'already_sent' })
      continue
    }

    const html = replaceFollowUpPlaceholders(template, {
      firstName: signup.first_name || ''
    })

    try {
      const resendResponse = await resend.emails.send({
        from: 'Pixel <notifications@notifications.getpixel.ai>',
        replyTo: 'support@getpixel.ai',
        to: signup.email,
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
        .from('signups')
        .update({ follow_up_sent_at: new Date().toISOString() })
        .eq('id', id)
        .select('id')

      if (updateError) {
        results.push({ id, status: 'error', error: `Email sent but failed to update record: ${updateError.message}` })
      } else if (!updateData || updateData.length === 0) {
        results.push({ id, status: 'error', error: 'Email sent but follow_up_sent_at not updated (RLS may be blocking updates)' })
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
