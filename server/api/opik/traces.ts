export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)

  const page = Number(query.page) || 1
  const size = Number(query.size) || 50

  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    project_name: 'Pixel AI',
    truncate: 'false'
  })

  const response = await $fetch<any>(`https://www.comet.com/opik/api/v1/private/traces?${params}`, {
    headers: {
      'Comet-Workspace': config.opikWorkspace as string,
      'authorization': config.opikApiKey as string
    }
  })

  return response
})
