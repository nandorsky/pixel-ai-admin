export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const params = new URLSearchParams()

  if (query.search) params.append('search', String(query.search))
  if (query.page) params.append('page', String(query.page))

  // Tag filters
  if (query.tag_ids) {
    const tagIds = Array.isArray(query.tag_ids) ? query.tag_ids : [query.tag_ids]
    tagIds.forEach((id: string) => params.append('filters[tag_ids][]', String(id)))
  }

  const url = `https://send.patent355.com/api/leads${params.toString() ? `?${params.toString()}` : ''}`

  try {
    const response = await $fetch(url, {
      headers: {
        'Authorization': `Bearer ${config.emailBisonApiKey}`,
        'Accept': 'application/json'
      }
    })
    return response
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch leads from Email Bison'
    })
  }
})
