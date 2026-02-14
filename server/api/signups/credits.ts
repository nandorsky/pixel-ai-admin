import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const email = query.email as string
  if (!email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'email query parameter is required'
    })
  }

  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.public.supabaseKey as string
  )

  // Look up the signup by email
  const { data: signup, error } = await supabase
    .from('signups')
    .select('id, email, first_name, last_name, referral_code')
    .eq('email', email.toLowerCase())
    .single()

  if (error || !signup) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Signup not found'
    })
  }

  // Count referrals
  const { count: referralCount } = await supabase
    .from('signups')
    .select('id', { count: 'exact', head: true })
    .eq('referred_by', signup.referral_code)

  const referrals = referralCount || 0
  const earned = 500 + (referrals * 500)
  const total = Math.max(1750, earned)

  return {
    email: signup.email,
    first_name: signup.first_name,
    credits: {
      total,
      earned,
      referrals,
      breakdown: {
        signup_bonus: 500,
        referral_bonus: referrals * 500,
        gift_bonus: Math.max(0, 1750 - earned)
      }
    }
  }
})
