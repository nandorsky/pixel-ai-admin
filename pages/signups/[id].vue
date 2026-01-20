<script setup lang="ts">
const route = useRoute()
const supabase = useSupabase()
const toast = useToast()

interface UtmParameters {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
}

interface Signup {
  id: number
  created_at: string
  email: string
  first_name: string | null
  last_name: string | null
  referral_code: string
  referred_by: string | null
  company_name: string | null
  role: string | null
  source: string | null
  hear_about_us: string | null
  utm_parameters: UtmParameters | null
}

const signup = ref<Signup | null>(null)
const referrer = ref<{ email: string; first_name: string | null; last_name: string | null } | null>(null)
const isLoading = ref(true)

async function fetchSignup() {
  isLoading.value = true
  const { data, error } = await supabase
    .from('signups')
    .select('*')
    .eq('id', route.params.id)
    .single()

  if (error) {
    toast.add({
      title: 'Error fetching signup',
      description: error.message,
      color: 'error'
    })
  } else {
    signup.value = data

    // Fetch referrer details if referred_by exists
    if (data?.referred_by) {
      const { data: referrerData } = await supabase
        .from('signups')
        .select('email, first_name, last_name')
        .eq('referral_code', data.referred_by)
        .single()
      referrer.value = referrerData || null
    }
  }
  isLoading.value = false
}

onMounted(() => {
  fetchSignup()
})

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fullName = computed(() => {
  if (!signup.value) return ''
  return `${signup.value.first_name || ''} ${signup.value.last_name || ''}`.trim() || 'Unknown'
})

const referrerDisplay = computed(() => {
  if (!referrer.value) return null
  const name = `${referrer.value.first_name || ''} ${referrer.value.last_name || ''}`.trim()
  if (name) {
    return `${name} (${referrer.value.email})`
  }
  return referrer.value.email
})
</script>

<template>
  <UDashboardPanel :id="`signup-${route.params.id}`">
    <template #header>
      <UDashboardNavbar :title="fullName">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            to="/signups"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin" />
      </div>

      <div v-else-if="signup" class="max-w-2xl space-y-6">
        <UCard>
          <template #header>
            <h3 class="font-semibold">Contact Information</h3>
          </template>

          <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt class="text-sm text-muted">Name</dt>
              <dd class="mt-1 font-medium">{{ fullName }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted">Email</dt>
              <dd class="mt-1 font-medium">{{ signup.email }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted">Company</dt>
              <dd class="mt-1 font-medium">{{ signup.company_name || '—' }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted">Role</dt>
              <dd class="mt-1 font-medium">{{ signup.role || '—' }}</dd>
            </div>
          </dl>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="font-semibold">Referral Details</h3>
          </template>

          <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt class="text-sm text-muted">Referral Code</dt>
              <dd class="mt-1 font-mono text-sm">{{ signup.referral_code }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted">Referred By</dt>
              <dd class="mt-1">{{ referrerDisplay || (signup.referred_by ? 'Unknown' : '—') }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted">Source</dt>
              <dd class="mt-1">{{ signup.source || '—' }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted">How They Heard About Us</dt>
              <dd class="mt-1">{{ signup.hear_about_us || '—' }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted">Signed Up</dt>
              <dd class="mt-1">{{ formatDate(signup.created_at) }}</dd>
            </div>
          </dl>
        </UCard>

        <UCard v-if="signup.utm_parameters">
          <template #header>
            <h3 class="font-semibold">UTM Parameters</h3>
          </template>

          <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div v-if="signup.utm_parameters.utm_source">
              <dt class="text-sm text-muted">Source</dt>
              <dd class="mt-1 font-medium">{{ signup.utm_parameters.utm_source }}</dd>
            </div>
            <div v-if="signup.utm_parameters.utm_medium">
              <dt class="text-sm text-muted">Medium</dt>
              <dd class="mt-1 font-medium">{{ signup.utm_parameters.utm_medium }}</dd>
            </div>
            <div v-if="signup.utm_parameters.utm_campaign">
              <dt class="text-sm text-muted">Campaign</dt>
              <dd class="mt-1 font-medium">{{ signup.utm_parameters.utm_campaign }}</dd>
            </div>
            <div v-if="signup.utm_parameters.utm_term">
              <dt class="text-sm text-muted">Term</dt>
              <dd class="mt-1 font-medium">{{ signup.utm_parameters.utm_term }}</dd>
            </div>
            <div v-if="signup.utm_parameters.utm_content">
              <dt class="text-sm text-muted">Content</dt>
              <dd class="mt-1 font-medium">{{ signup.utm_parameters.utm_content }}</dd>
            </div>
          </dl>
        </UCard>
      </div>

      <div v-else class="text-center py-12 text-muted">
        Signup not found
      </div>
    </template>
  </UDashboardPanel>
</template>
