export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  console.log('Adding to waitlist:', { email: body.email, firstName: body.firstName, lastName: body.lastName })

  try {
    const response = await fetch('https://getpixel.ai/api/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        utmParameters: {
          utm_medium: 'cold_outreach'
        }
      })
    })

    const data = await response.json().catch(() => ({}))
    console.log('Waitlist response:', response.status, data)

    // 409 = already signed up, treat as success
    if (response.status === 409) {
      return { success: true, alreadySignedUp: true }
    }

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: data.message || 'Failed to add to waitlist'
      })
    }

    return data
  } catch (error: any) {
    console.error('Waitlist error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to add to waitlist'
    })
  }
})
