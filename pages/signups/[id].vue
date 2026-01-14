<script setup lang="ts">
const route = useRoute()
const supabase = useSupabase()
const toast = useToast()

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
  monthly_ad_spend: string | null
  channels: string | null
  wants_to_share: string | null
}

const signup = ref<Signup | null>(null)
const referrerEmail = ref<string | null>(null)
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

    // Fetch referrer email if referred_by exists
    if (data?.referred_by) {
      const { data: referrer } = await supabase
        .from('signups')
        .select('email')
        .eq('referral_code', data.referred_by)
        .single()
      referrerEmail.value = referrer?.email || null
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

function parseChannels(channels: string | null): string[] {
  if (!channels) return []
  try {
    return JSON.parse(channels)
  } catch {
    return []
  }
}

const fullName = computed(() => {
  if (!signup.value) return ''
  return `${signup.value.first_name || ''} ${signup.value.last_name || ''}`.trim() || 'Unknown'
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
              <dd class="mt-1">{{ referrerEmail || (signup.referred_by ? 'Unknown' : '—') }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted">Signed Up</dt>
              <dd class="mt-1">{{ formatDate(signup.created_at) }}</dd>
            </div>
          </dl>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="font-semibold">Advertising Details</h3>
          </template>

          <dl class="grid grid-cols-1 gap-4">
            <div>
              <dt class="text-sm text-muted">Monthly Ad Spend</dt>
              <dd class="mt-1 font-medium">{{ signup.monthly_ad_spend || '—' }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted">Channels</dt>
              <dd class="mt-2 flex flex-wrap gap-2">
                <UBadge
                  v-for="channel in parseChannels(signup.channels)"
                  :key="channel"
                  color="neutral"
                  variant="subtle"
                >
                  {{ channel }}
                </UBadge>
                <span v-if="!parseChannels(signup.channels).length" class="text-muted">—</span>
              </dd>
            </div>
            <div>
              <dt class="text-sm text-muted">Wants to Share</dt>
              <dd class="mt-1 font-medium capitalize">{{ signup.wants_to_share || '—' }}</dd>
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
