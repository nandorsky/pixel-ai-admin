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
    emailBisonApiKey: process.env.EMAIL_BISON_API_KEY,
    resendApiKey: process.env.RESEND_API_KEY,
    opikApiKey: process.env.OPIK_API_KEY,
    opikWorkspace: process.env.OPIK_WORKSPACE,
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY
    }
  },

  compatibilityDate: '2025-01-13'
})
