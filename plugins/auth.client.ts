export default defineNuxtPlugin(async () => {
  const supabase = useSupabase()

  // Handle auth state changes (including magic link callback)
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      // Redirect to home after successful sign in
      const currentPath = window.location.pathname
      if (currentPath === '/login') {
        await navigateTo('/')
      }
    }
    if (event === 'SIGNED_OUT') {
      await navigateTo('/login')
    }
  })

  // Check for auth callback in URL hash (magic link)
  const hash = window.location.hash
  if (hash && hash.includes('access_token')) {
    // Let Supabase handle the callback - it will trigger onAuthStateChange
    await supabase.auth.getSession()
  }
})
