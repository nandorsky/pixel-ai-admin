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

  const resend = new Resend(config.resendApiKey as string)
  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.public.supabaseKey as string
  )

  const results: { id: number; status: string; error?: string }[] = []

  for (const id of ids) {
    const { data: signup, error: fetchError } = await supabase
      .from('signups')
      .select('id, email, first_name, invite_sent_at')
      .eq('id', id)
      .single()

    if (fetchError || !signup) {
      results.push({ id, status: 'error', error: fetchError?.message || 'Not found' })
      continue
    }

    if (signup.invite_sent_at) {
      results.push({ id, status: 'already_sent' })
      continue
    }

    const firstName = signup.first_name || ''

    try {
      await resend.emails.send({
        from: 'Pixel <notifications@getpixel.ai>',
        to: signup.email,
        subject: "You're in! Your Pixel invite is ready",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
            <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">
              ${firstName ? `Hey ${firstName}, you're` : "You're"} in! 🎉
            </h1>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Great news — your access to Pixel is ready. Click below to get started.
            </p>
            <a href="https://getpixel.ai/login" style="display: inline-block; margin: 24px 0; padding: 12px 28px; background-color: #16a34a; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              Get Started
            </a>
            <p style="font-size: 14px; color: #666; margin-top: 32px;">
              If you have any questions, just reply to this email.
            </p>
            <p style="font-size: 14px; color: #666;">— The Pixel Team</p>
          </div>
        `
      })

      const { error: updateError } = await supabase
        .from('signups')
        .update({ invite_sent_at: new Date().toISOString() })
        .eq('id', id)

      if (updateError) {
        results.push({ id, status: 'error', error: `Email sent but failed to update record: ${updateError.message}` })
      } else {
        results.push({ id, status: 'sent' })
      }
    } catch (err: any) {
      results.push({ id, status: 'error', error: err.message || 'Failed to send email' })
    }
  }

  return { results }
})
