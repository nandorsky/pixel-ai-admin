export default defineNuxtRouteMiddleware(async (to) => {
  // Only run on client side
  if (import.meta.server) {
    return
  }

  // Skip auth check for login page
  if (to.path === '/login') {
    return
  }

  // Skip if there's an auth callback in the URL hash (magic link)
  if (window.location.hash && window.location.hash.includes('access_token')) {
    return
  }

  const supabase = useSupabase()
  const { data: { session } } = await supabase.auth.getSession()

  // Redirect to login if not authenticated
  if (!session) {
    return navigateTo('/login')
  }
})
