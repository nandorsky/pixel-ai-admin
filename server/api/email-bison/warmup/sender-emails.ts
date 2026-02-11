export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  // Date range (required by API, default to last 30 days)
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  const dateParams = new URLSearchParams()
  dateParams.append('start_date', query.start_date ? String(query.start_date) : startDate.toISOString().split('T')[0])
  dateParams.append('end_date', query.end_date ? String(query.end_date) : endDate.toISOString().split('T')[0])

  const baseUrl = `https://send.patent355.com/api/warmup/sender-emails?${dateParams.toString()}`
  const headers = {
    'Authorization': `Bearer ${config.emailBisonApiKey}`,
    'Accept': 'application/json'
  }

  try {
    // Fetch first page to get total pages
    const firstPage: any = await $fetch(`${baseUrl}&page=1`, { headers })
    const allData = [...(firstPage?.data || [])]
    const lastPage = firstPage?.meta?.last_page || firstPage?.last_page || 1

    // Fetch remaining pages in parallel
    if (lastPage > 1) {
      const pages = Array.from({ length: lastPage - 1 }, (_, i) => i + 2)
      const responses = await Promise.all(
        pages.map(page => $fetch(`${baseUrl}&page=${page}`, { headers }))
      )
      responses.forEach((res: any) => {
        allData.push(...(res?.data || []))
      })
    }

    return { data: allData }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch warmup stats from Email Bison'
    })
  }
})
