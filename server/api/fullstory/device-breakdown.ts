export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const apiKey = config.fullstoryApiKey as string

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'FULLSTORY_API_KEY not configured'
    })
  }

  const baseUrl = 'https://api.fullstory.com'
  const headers = {
    'Authorization': `Basic ${apiKey}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }

  // Test which endpoints are accessible
  const endpoints = [
    { name: 'List Segments', method: 'GET', url: `${baseUrl}/segments/v1` },
    { name: 'Data Export List', method: 'GET', url: `${baseUrl}/api/v1/export/list` },
    { name: 'Search Events v2', method: 'POST', url: `${baseUrl}/v2/events/search`, body: { query: {} } },
    { name: 'Search Sessions v2', method: 'POST', url: `${baseUrl}/v2/sessions/search`, body: { query: {} } },
    { name: 'List Users v2', method: 'GET', url: `${baseUrl}/v2/users?limit=1` },
    { name: 'Segment Export', method: 'POST', url: `${baseUrl}/segments/v1/exports`, body: { segmentId: 'everyone', type: 'TYPE_SESSIONS', format: 'FORMAT_JSON' } },
  ]

  const results: any[] = []

  for (const ep of endpoints) {
    try {
      const opts: any = { method: ep.method, headers }
      if (ep.body) opts.body = ep.body
      const result = await $fetch<any>(ep.url, opts)
      const preview = JSON.stringify(result).slice(0, 200)
      console.log(`✅ ${ep.name}: ${preview}`)
      results.push({ name: ep.name, status: 'ok', preview })
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.message || 'Unknown error'
      console.log(`❌ ${ep.name}: ${errMsg}`)
      results.push({ name: ep.name, status: 'error', error: errMsg })
    }
  }

  return { endpoints: results }
})
