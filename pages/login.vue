<script setup lang="ts">
definePageMeta({
  layout: false
})

const supabase = useSupabase()
const toast = useToast()

const ALLOWED_EMAILS = [
  'gil@metadata.io',
  'nate.andorsky@metadata.io',
  'lisa.sharapata@metadata.io'
]

const email = ref('')
const isLoading = ref(false)
const emailSent = ref(false)

// Redirect to home if already authenticated
onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    navigateTo('/')
  }
})

async function sendMagicLink() {
  if (!email.value) {
    toast.add({
      title: 'Email required',
      description: 'Please enter your email address',
      color: 'error'
    })
    return
  }

  if (!ALLOWED_EMAILS.includes(email.value.toLowerCase())) {
    toast.add({
      title: 'Access denied',
      description: 'This email is not authorized to access this application',
      color: 'error'
    })
    return
  }

  isLoading.value = true

  const { error } = await supabase.auth.signInWithOtp({
    email: email.value,
    options: {
      emailRedirectTo: `${window.location.origin}/`
    }
  })

  isLoading.value = false

  if (error) {
    toast.add({
      title: 'Error sending magic link',
      description: error.message,
      color: 'error'
    })
  } else {
    emailSent.value = true
  }
}
</script>

<template>
  <UApp>
    <div class="min-h-screen flex items-center justify-center bg-default">
      <div class="w-full max-w-sm px-4">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-highlighted">Welcome back</h1>
          <p class="text-muted mt-2">Sign in to your account</p>
        </div>

        <UCard>
          <div v-if="emailSent" class="text-center py-4 space-y-4">
            <div class="size-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <UIcon name="i-lucide-mail-check" class="size-6 text-primary" />
            </div>
            <div>
              <p class="font-medium text-highlighted">Check your email</p>
              <p class="text-sm text-muted mt-1">
                We sent a magic link to<br>
                <span class="font-medium text-highlighted">{{ email }}</span>
              </p>
            </div>
            <UButton
              variant="link"
              color="neutral"
              @click="emailSent = false"
            >
              Use a different email
            </UButton>
          </div>

          <form v-else @submit.prevent="sendMagicLink" class="space-y-6">
            <UFormField label="Email address" name="email">
              <UInput
                v-model="email"
                type="email"
                placeholder="you@metadata.io"
                size="lg"
                autofocus
              />
            </UFormField>

            <UButton
              type="submit"
              block
              size="lg"
              :loading="isLoading"
            >
              Continue with email
            </UButton>
          </form>
        </UCard>
      </div>
    </div>
  </UApp>
</template>
