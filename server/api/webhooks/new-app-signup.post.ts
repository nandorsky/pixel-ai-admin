import { Resend } from 'resend'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // Supabase webhook sends: { type, table, record, schema, old_record }
  const record = body?.record
  if (!record) {
    throw createError({ statusCode: 400, statusMessage: 'No record in payload' })
  }

  const payload = record.json_payload || {}
  const email = payload.email || 'Unknown'
  const referredBy = payload.referredBy || 'None'
  const earlyAccess = payload.earlyAccess ? 'Yes' : 'No'
  const referralCode = payload.referralCode || 'None'
  const createdAt = record.created_at
    ? new Date(record.created_at).toLocaleString('en-US', { timeZone: 'America/New_York' })
    : 'Unknown'

  const resend = new Resend(config.resendApiKey as string)

  const { error } = await resend.emails.send({
    from: 'Pixel <notifications@notifications.getpixel.ai>',
    to: 'nate@patent355.com',
    subject: `New Pixel Signup: ${email}`,
    html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; padding: 20px;">
  <h2 style="font-size: 18px; margin-bottom: 16px;">New App Signup</h2>
  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
    <tr><td style="padding: 8px 0; color: #666; width: 120px;">Email</td><td style="padding: 8px 0; font-weight: 600;">${email}</td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Referred By</td><td style="padding: 8px 0;">${referredBy}</td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Early Access</td><td style="padding: 8px 0;">${earlyAccess}</td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Referral Code</td><td style="padding: 8px 0; font-family: monospace;">${referralCode}</td></tr>
    <tr><td style="padding: 8px 0; color: #666;">Signed Up</td><td style="padding: 8px 0;">${createdAt}</td></tr>
  </table>
</div>`
  })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return { ok: true }
})
