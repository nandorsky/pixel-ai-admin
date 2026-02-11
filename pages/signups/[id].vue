<script setup lang="ts">
import { getSignupSource, getSourceColor } from '~/utils/signup-source'

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
  companyURL?: string
  location?: string
  description?: string
  employmentType?: string
  start?: { year?: number; month?: number }
  end?: { year?: number; month?: number }
}

interface LinkedInSkill {
  name: string
  endorsementsCount?: number
}

interface LinkedInEducation {
  schoolName?: string
  degree?: string
  fieldOfStudy?: string
  description?: string
  logo?: { url: string }[]
  start?: { year?: number }
  end?: { year?: number }
}

interface LinkedInLanguage {
  name: string
  proficiency?: string
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
  skills?: LinkedInSkill[]
  educations?: LinkedInEducation[]
  languages?: LinkedInLanguage[]
  isCreator?: boolean
  isPremium?: boolean
}

function getLinkedInPhoto(linkedin: LinkedInJson | null | undefined): string | null {
  if (!linkedin) return null
  if (linkedin.profilePicture) return linkedin.profilePicture
  if (linkedin.profilePictures?.length) {
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
  hear_about_us: string | null
  utm_parameters: UtmParameters | null
  linkedin_json: LinkedInJson | null
}

const signup = ref<Signup | null>(null)
const referrer = ref<{ email: string; first_name: string | null; last_name: string | null } | null>(null)
const referrals = ref<{ id: number; email: string; first_name: string | null; last_name: string | null; created_at: string; linkedin_json: LinkedInJson | null }[]>([])
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

    if (data?.referred_by) {
      const { data: referrerData } = await supabase
        .from('signups')
        .select('email, first_name, last_name')
        .eq('referral_code', data.referred_by)
        .single()
      referrer.value = referrerData || null
    }

    // Fetch people this person has referred
    if (data?.referral_code) {
      const { data: referralsData } = await supabase
        .from('signups')
        .select('id, email, first_name, last_name, created_at, linkedin_json')
        .eq('referred_by', data.referral_code)
        .order('created_at', { ascending: false })
      referrals.value = referralsData || []
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

function formatPositionDate(date: { year?: number; month?: number } | undefined): string {
  if (!date?.year) return 'Present'
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  if (date.month) {
    return `${months[date.month - 1]} ${date.year}`
  }
  return `${date.year}`
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
  return signup.value.linkedin_json.position.find(p => !p.end?.year) || signup.value.linkedin_json.position[0]
})

const linkedInProfileUrl = computed(() => {
  if (!signup.value?.linkedin_json?.username) return null
  return `https://www.linkedin.com/in/${signup.value.linkedin_json.username}`
})

const topSkills = computed(() => {
  if (!signup.value?.linkedin_json?.skills?.length) return []
  return [...signup.value.linkedin_json.skills]
    .sort((a, b) => (b.endorsementsCount || 0) - (a.endorsementsCount || 0))
    .slice(0, 12)
})

const allPositions = computed(() => {
  if (!signup.value?.linkedin_json?.position?.length) return []
  return signup.value.linkedin_json.position
})

const currentCompany = computed(() => {
  return currentPosition.value?.companyName || null
})

const signupSource = computed(() => {
  if (!signup.value) return null
  return getSignupSource(signup.value)
})

const sourceColor = computed(() => {
  if (!signupSource.value) return ''
  return getSourceColor(signupSource.value)
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

      <div v-else-if="signup">
        <!-- Profile Header -->
        <div v-if="signup.linkedin_json" class="flex gap-4 pb-6 border-b border-default mb-6">
          <img
            v-if="getLinkedInPhoto(signup.linkedin_json)"
            :src="getLinkedInPhoto(signup.linkedin_json)!"
            :alt="fullName"
            class="w-24 h-24 rounded-full object-cover shrink-0"
          />
          <div v-else class="w-24 h-24 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-2xl font-medium text-muted shrink-0">
            {{ [signup.first_name, signup.last_name].filter(Boolean).map(n => n?.charAt(0)).join('').toUpperCase() || signup.email.charAt(0).toUpperCase() }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="text-xl font-semibold">{{ fullName }}</h2>
              <span v-if="signup.linkedin_json.isPremium" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                Premium
              </span>
              <span v-if="signup.linkedin_json.isCreator" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                Creator
              </span>
            </div>
            <p v-if="signup.linkedin_json.headline" class="text-muted mt-1">
              {{ signup.linkedin_json.headline }}
            </p>
            <p v-if="signup.linkedin_json.geo?.full" class="text-sm text-muted mt-1">
              {{ signup.linkedin_json.geo.full }}
            </p>
            <div class="flex items-center gap-4 mt-3">
              <div v-if="currentPosition" class="flex items-center gap-2">
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
              <a
                v-if="linkedInProfileUrl"
                :href="linkedInProfileUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                View LinkedIn
                <UIcon name="i-lucide-external-link" class="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <!-- Two Column Layout -->
        <div class="flex gap-6">
          <!-- Main Content (Left) -->
          <div class="flex-1 space-y-6 min-w-0">
            <!-- Contact Information -->
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
                  <dd class="mt-1 font-medium">{{ currentCompany || '—' }}</dd>
                </div>
              </dl>
            </UCard>

            <!-- UTM Parameters -->
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

            <!-- About / Summary -->
            <UCard v-if="signup.linkedin_json?.summary">
              <template #header>
                <h3 class="font-semibold">About</h3>
              </template>
              <p class="whitespace-pre-wrap text-sm">{{ signup.linkedin_json.summary }}</p>
            </UCard>

            <!-- Skills -->
            <UCard v-if="topSkills.length">
              <template #header>
                <h3 class="font-semibold">Top Skills</h3>
              </template>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="skill in topSkills"
                  :key="skill.name"
                  class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-neutral-100 dark:bg-neutral-800"
                >
                  {{ skill.name }}
                  <span v-if="skill.endorsementsCount" class="text-xs text-muted">({{ skill.endorsementsCount }})</span>
                </span>
              </div>
            </UCard>

            <!-- Experience -->
            <UCard v-if="allPositions.length">
              <template #header>
                <h3 class="font-semibold">Experience</h3>
              </template>
              <div class="space-y-4">
                <div v-for="(position, index) in allPositions" :key="index" class="flex gap-3">
                  <img
                    v-if="position.companyLogo"
                    :src="position.companyLogo"
                    :alt="position.companyName"
                    class="w-12 h-12 rounded object-cover shrink-0"
                  />
                  <div v-else class="w-12 h-12 rounded bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-sm font-medium text-muted shrink-0">
                    {{ position.companyName?.charAt(0) || '?' }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="font-medium">{{ position.title }}</p>
                    <p class="text-sm text-muted">{{ position.companyName }}</p>
                    <p class="text-xs text-muted mt-0.5">
                      {{ formatPositionDate(position.start) }} — {{ formatPositionDate(position.end) }}
                      <span v-if="position.location"> · {{ position.location }}</span>
                    </p>
                    <p v-if="position.description" class="text-sm mt-2 whitespace-pre-wrap">{{ position.description }}</p>
                  </div>
                </div>
              </div>
            </UCard>

            <!-- Education -->
            <UCard v-if="signup.linkedin_json?.educations?.length">
              <template #header>
                <h3 class="font-semibold">Education</h3>
              </template>
              <div class="space-y-4">
                <div v-for="(edu, index) in signup.linkedin_json.educations" :key="index" class="flex gap-3">
                  <img
                    v-if="edu.logo?.[0]?.url"
                    :src="edu.logo[0].url"
                    :alt="edu.schoolName"
                    class="w-12 h-12 rounded object-cover shrink-0"
                  />
                  <div v-else class="w-12 h-12 rounded bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-sm font-medium text-muted shrink-0">
                    {{ edu.schoolName?.charAt(0) || '?' }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="font-medium">{{ edu.schoolName }}</p>
                    <p v-if="edu.degree || edu.fieldOfStudy" class="text-sm text-muted">
                      {{ [edu.degree, edu.fieldOfStudy].filter(Boolean).join(' · ') }}
                    </p>
                    <p v-if="edu.start?.year || edu.end?.year" class="text-xs text-muted mt-0.5">
                      {{ edu.start?.year || '' }}{{ edu.start?.year && edu.end?.year ? ' — ' : '' }}{{ edu.end?.year || '' }}
                    </p>
                    <p v-if="edu.description" class="text-sm mt-2 whitespace-pre-wrap">{{ edu.description }}</p>
                  </div>
                </div>
              </div>
            </UCard>

            <!-- Languages -->
            <UCard v-if="signup.linkedin_json?.languages?.length">
              <template #header>
                <h3 class="font-semibold">Languages</h3>
              </template>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="lang in signup.linkedin_json.languages"
                  :key="lang.name"
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-neutral-100 dark:bg-neutral-800"
                >
                  {{ lang.name }}
                </span>
              </div>
            </UCard>
          </div>

          <!-- Right Sidebar -->
          <div class="w-80 shrink-0 space-y-6">
            <!-- Referral Details -->
            <UCard>
              <template #header>
                <h3 class="font-semibold">Referral Details</h3>
              </template>

              <dl class="space-y-4">
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
                  <dd class="mt-1">
                    <span
                      v-if="signupSource"
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                      :style="{ backgroundColor: sourceColor }"
                    >
                      {{ signupSource }}
                    </span>
                    <span v-else>—</span>
                  </dd>
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

            <!-- People They Referred -->
            <UCard v-if="referrals.length">
              <template #header>
                <h3 class="font-semibold">Referred {{ referrals.length }} {{ referrals.length === 1 ? 'Person' : 'People' }}</h3>
              </template>

              <div class="space-y-3">
                <NuxtLink
                  v-for="ref in referrals"
                  :key="ref.id"
                  :to="`/signups/${ref.id}`"
                  class="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-accented/50 transition-colors"
                >
                  <img
                    v-if="getLinkedInPhoto(ref.linkedin_json)"
                    :src="getLinkedInPhoto(ref.linkedin_json)!"
                    :alt="[ref.first_name, ref.last_name].filter(Boolean).join(' ') || ref.email"
                    class="size-8 rounded-full object-cover shrink-0"
                  />
                  <div v-else class="size-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-medium text-muted shrink-0">
                    {{ [ref.first_name, ref.last_name].filter(Boolean).map(n => n?.charAt(0)).join('').toUpperCase() || ref.email.charAt(0).toUpperCase() }}
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium truncate">
                      {{ [ref.first_name, ref.last_name].filter(Boolean).join(' ') || ref.email }}
                    </p>
                    <p class="text-xs text-muted truncate">{{ ref.email }}</p>
                  </div>
                </NuxtLink>
              </div>
            </UCard>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12 text-muted">
        Signup not found
      </div>
    </template>
  </UDashboardPanel>
</template>
