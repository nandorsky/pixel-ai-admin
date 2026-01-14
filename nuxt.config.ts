export default defineNuxtConfig({
  modules: ['@nuxt/ui'],

  app: {
    head: {
      meta: [
        { name: 'robots', content: 'noindex, nofollow' }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  ui: {
    colors: {
      primary: 'green',
      neutral: 'zinc'
    }
  },

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY
    }
  },

  compatibilityDate: '2025-01-13'
})
