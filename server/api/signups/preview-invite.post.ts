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
    .select('id, email, first_name, referral_code')
    .eq('id', id)
    .single()

  if (error || !signup) {
    throw createError({ statusCode: 404, statusMessage: 'Signup not found' })
  }

  const { count: referralCount } = await supabase
    .from('signups')
    .select('id', { count: 'exact', head: true })
    .eq('referred_by', signup.referral_code)

  const referrals = referralCount || 0
  const earned = 500 + (referrals * 500)
  const credits = Math.max(1750, earned)

  const subject = `You're in — and you're starting with ${credits.toLocaleString()} credits`
  const html = replaceInvitePlaceholders(buildInviteTemplate(), {
    firstName: signup.first_name || '',
    credits,
    referralCount: referrals
  })

  return { subject, html }
})
