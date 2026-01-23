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

interface LinkedInPosition {
  title?: string
  companyName?: string
  companyLogo?: string
  start?: { year?: number; month?: number }
  end?: { year?: number; month?: number }
}

interface LinkedInProfilePicture {
  url: string
  width: number
  height: number
}

interface LinkedInJson {
  headline?: string
  summary?: string
  profilePicture?: string
  profilePictures?: LinkedInProfilePicture[]
  firstName?: string
  lastName?: string
  username?: string
  geo?: { full?: string; city?: string; country?: string }
  position?: LinkedInPosition[]
}

function getLinkedInPhoto(linkedin: LinkedInJson | null | undefined): string | null {
  if (!linkedin) return null
  if (linkedin.profilePicture) return linkedin.profilePicture
  if (linkedin.profilePictures?.length) {
    // Prefer 400x400 size for detail page, fallback to largest available
    const preferred = linkedin.profilePictures.find(p => p.width === 400)
      || linkedin.profilePictures[linkedin.profilePictures.length - 1]
    return preferred?.url || null
  }
  return null
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
  linkedin_json: LinkedInJson | null
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

const currentPosition = computed(() => {
  if (!signup.value?.linkedin_json?.position?.length) return null
  // Find position with no end date (current job)
  return signup.value.linkedin_json.position.find(p => !p.end?.year) || signup.value.linkedin_json.position[0]
})

const linkedInProfileUrl = computed(() => {
  if (!signup.value?.linkedin_json?.username) return null
  return `https://www.linkedin.com/in/${signup.value.linkedin_json.username}`
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

        <UCard v-if="signup.linkedin_json">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold">LinkedIn Profile</h3>
              <a
                v-if="linkedInProfileUrl"
                :href="linkedInProfileUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                View Profile
                <UIcon name="i-lucide-external-link" class="w-3 h-3" />
              </a>
            </div>
          </template>

          <div class="flex gap-4">
            <img
              v-if="getLinkedInPhoto(signup.linkedin_json)"
              :src="getLinkedInPhoto(signup.linkedin_json)!"
              :alt="fullName"
              class="w-20 h-20 rounded-full object-cover shrink-0"
            />
            <div class="min-w-0 flex-1">
              <p v-if="signup.linkedin_json.headline" class="font-medium text-lg">
                {{ signup.linkedin_json.headline }}
              </p>
              <p v-if="signup.linkedin_json.geo?.full" class="text-sm text-muted mt-1">
                {{ signup.linkedin_json.geo.full }}
              </p>
              <div v-if="currentPosition" class="mt-3 flex items-center gap-2">
                <img
                  v-if="currentPosition.companyLogo"
                  :src="currentPosition.companyLogo"
                  :alt="currentPosition.companyName"
                  class="w-8 h-8 rounded object-cover"
                />
                <div>
                  <p class="text-sm font-medium">{{ currentPosition.title }}</p>
                  <p class="text-xs text-muted">{{ currentPosition.companyName }}</p>
                </div>
              </div>
            </div>
          </div>
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
