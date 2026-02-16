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

  const template = body.htmlTemplate || buildInviteTemplate()
  const subject = body.subject || `You're in — and you're starting with {{credits}} credits`
  const results: { id: number; status: string; error?: string }[] = []

  for (const id of ids) {
    const { data: signup, error: fetchError } = await supabase
      .from('signups')
      .select('id, email, first_name, invite_sent_at, referral_code')
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

    const { count: referralCount } = await supabase
      .from('signups')
      .select('id', { count: 'exact', head: true })
      .eq('referred_by', signup.referral_code)

    const referrals = referralCount || 0
    const earned = 500 + (referrals * 500)
    const credits = Math.max(1750, earned)

    const html = replaceInvitePlaceholders(template, {
      firstName,
      credits,
      referralCount: referrals
    })

    try {
      const { data: emailResult, error: emailError } = await resend.emails.send({
        from: 'Pixel <notifications@notifications.getpixel.ai>',
        to: signup.email,
        subject: subject.replace('{{credits}}', credits.toLocaleString()),
        html
      })

      if (emailError) {
        results.push({ id, status: 'error', error: emailError.message })
        continue
      }

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
