<script setup lang="ts">
import { sub, format, formatDistanceToNow, startOfDay, eachDayOfInterval } from 'date-fns'
import { VisXYContainer, VisLine, VisAxis, VisArea, VisCrosshair, VisTooltip } from '@unovis/vue'

type ChartRecord = { date: Date; count: number }

const supabase = useSupabase()

interface AppSignup {
  id: number
  created_at: string
  json_payload: {
    email: string
    referredBy: string | null
    waitlistId: number | null
    earlyAccess: boolean
    referralUrl: string | null
    referralCode: string | null
  }
  linkedin_json: any | null
}

const appSignups = ref<AppSignup[]>([])
const loading = ref(true)
const activeEmails = ref<Set<string>>(new Set())
const rawTracesByEmail = ref<Record<string, any[]>>({})
const isLoadingActive = ref(true)
const stripeSpend = ref<Record<string, number>>({})
const isLoadingStripe = ref(true)
const recentTraces = ref<any[]>([])

function getLinkedInPhoto(lj: any): string | null {
  if (!lj) return null
  if (lj.profilePicture) return lj.profilePicture
  if (lj.profilePictures?.length) {
    const preferred = lj.profilePictures.find((p: any) => p.width === 100) || lj.profilePictures[0]
    return preferred?.url || null
  }
  return null
}

function getLinkedInName(lj: any): string | null {
  if (!lj) return null
  return [lj.firstName, lj.lastName].filter(Boolean).join(' ') || null
}

function getTraceInput(trace: any): string {
  if (!trace.input?.messages?.length) return ''
  const human = trace.input.messages.find((m: any) => m.type === 'human')
  return human?.content || ''
}

function timeAgo(dateString: string): string {
  const now = new Date()
  const then = new Date(dateString)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDistanceToNow(then, { addSuffix: true })
}

// Computed stats
const activeCount = computed(() => {
  return appSignups.value.filter(s => activeEmails.value.has(s.json_payload?.email?.toLowerCase())).length
})

const payingCount = computed(() => {
  return appSignups.value.filter(s => stripeSpend.value[s.json_payload?.email?.toLowerCase()]).length
})

const totalRevenue = computed(() => {
  return Object.values(stripeSpend.value).reduce((sum, amount) => sum + amount, 0)
})

// App signups chart data (last 30 days cumulative)
const appSignupsChartData = computed<ChartRecord[]>(() => {
  if (!appSignups.value.length) return []

  const range = {
    start: sub(new Date(), { days: 30 }),
    end: new Date()
  }

  const dates = eachDayOfInterval(range)
  const countsByDate = new Map<string, number>()

  dates.forEach(date => {
    countsByDate.set(startOfDay(date).toISOString(), 0)
  })

  appSignups.value.forEach(signup => {
    const signupDate = startOfDay(new Date(signup.created_at)).toISOString()
    if (countsByDate.has(signupDate)) {
      countsByDate.set(signupDate, (countsByDate.get(signupDate) || 0) + 1)
    }
  })

  const baseline = appSignups.value.filter(s => new Date(s.created_at) < range.start).length

  let runningTotal = baseline
  return dates.map(date => {
    runningTotal += countsByDate.get(startOfDay(date).toISOString()) || 0
    return { date, count: runningTotal }
  })
})

const chartX = (_: ChartRecord, i: number) => i
const chartY = (d: ChartRecord) => d.count
const chartXTicks = (i: number) => {
  if (!appSignupsChartData.value[i] || i === 0 || i === appSignupsChartData.value.length - 1) return ''
  return format(appSignupsChartData.value[i].date, 'd MMM')
}
const chartTooltipTemplate = (d: ChartRecord) => `${format(d.date, 'MMM d')}: ${d.count} total`

// Recent app signups (8 most recent)
const recentAppSignups = computed(() => {
  return appSignups.value.slice(0, 8)
})

// Build email -> app_signup lookup for trace avatars
const appSignupByEmail = computed(() => {
  const map: Record<string, AppSignup> = {}
  for (const s of appSignups.value) {
    const email = s.json_payload?.email?.toLowerCase()
    if (email) map[email] = s
  }
  return map
})

// Recent prompts from traces
const recentPrompts = computed(() => {
  return recentTraces.value
    .map(trace => {
      const email = (trace.metadata?.user_email || trace.metadata?.user_meail || '').toLowerCase()
      const signup = appSignupByEmail.value[email]
      const prompt = getTraceInput(trace)
      if (!prompt) return null
      return {
        id: trace.id,
        email,
        name: signup ? getLinkedInName(signup.linkedin_json) : null,
        photo: signup ? getLinkedInPhoto(signup.linkedin_json) : null,
        prompt,
        time: trace.start_time || trace.created_at
      }
    })
    .filter(Boolean)
    .slice(0, 10)
})

async function fetchAppSignups() {
  loading.value = true

  const [signupsResult, testUsersResult] = await Promise.all([
    supabase
      .from('app_signups')
      .select('id, created_at, json_payload, linkedin_json')
      .order('created_at', { ascending: false }),
    supabase
      .from('test_users')
      .select('email')
  ])

  const suppressedEmails = new Set(
    (testUsersResult.data || []).map((r: any) => r.email?.toLowerCase()).filter(Boolean)
  )

  if (signupsResult.data) {
    appSignups.value = signupsResult.data.filter((s: any) => {
      const email = s.json_payload?.email?.toLowerCase()
      return !email || (!suppressedEmails.has(email) && !email.endsWith('@metadata.io'))
    })
  }

  loading.value = false
}

async function fetchActiveEmails() {
  isLoadingActive.value = true
  try {
    const emails = new Set<string>()
    const byEmail: Record<string, any[]> = {}
    let page = 1
    const size = 200
    let total = 0

    do {
      const result = await $fetch<any>('/api/opik/traces', {
        params: { page, size }
      })
      total = result.total || 0

      // Save first page traces for recent prompts feed
      if (page === 1) {
        recentTraces.value = (result.content || []).slice(0, 10)
      }

      for (const trace of (result.content || [])) {
        const email = trace.metadata?.user_email || trace.metadata?.user_meail
        if (email) {
          const key = email.toLowerCase()
          emails.add(key)
          if (!byEmail[key]) byEmail[key] = []
          byEmail[key].push(trace)
        }
      }
      page++
    } while ((page - 1) * size < total)

    activeEmails.value = emails
    rawTracesByEmail.value = byEmail
  } catch {
    // Silently fail - not critical
  }
  isLoadingActive.value = false
}

async function fetchStripeSpend() {
  isLoadingStripe.value = true
  try {
    const result = await $fetch<any>('/api/stripe/spend-by-email')
    stripeSpend.value = result.spendByEmail || {}
  } catch {
    // Silently fail - not critical
  }
  isLoadingStripe.value = false
}

onMounted(() => {
  fetchAppSignups()
  fetchActiveEmails()
  fetchStripeSpend()
})
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading message -->
      <div v-if="loading || isLoadingActive || isLoadingStripe" class="flex items-center gap-3 mb-6 p-4 bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-lg">
        <UIcon name="i-lucide-loader-2" class="size-4 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
        <p class="text-sm text-blue-700 dark:text-blue-300">Please be patient while this data loads, it is pulling from a number of APIs. Its not stuck, just takes awhile.</p>
      </div>

      <!-- Stats Row -->
      <div class="flex items-center gap-3 mb-8">
        <div class="bg-elevated px-4 py-2 rounded-lg">
          <span class="text-xs text-muted uppercase tracking-wide">Signups</span>
          <span class="text-lg font-semibold text-highlighted ml-2">{{ appSignups.length.toLocaleString() }}</span>
        </div>
        <div class="bg-elevated px-4 py-2 rounded-lg">
          <span class="text-xs text-muted uppercase tracking-wide">Active</span>
          <UIcon v-if="isLoadingActive" name="i-lucide-loader-2" class="size-4 animate-spin text-muted ml-2 inline-block align-middle" />
          <template v-else>
            <span class="text-lg font-semibold text-highlighted ml-2">{{ activeCount.toLocaleString() }}</span>
            <span v-if="appSignups.length > 0" class="text-xs text-muted ml-1">({{ Math.round((activeCount / appSignups.length) * 100) }}%)</span>
          </template>
        </div>
        <div class="bg-elevated px-4 py-2 rounded-lg">
          <span class="text-xs text-muted uppercase tracking-wide">Paying</span>
          <UIcon v-if="isLoadingStripe" name="i-lucide-loader-2" class="size-4 animate-spin text-muted ml-2 inline-block align-middle" />
          <template v-else>
            <span class="text-lg font-semibold text-highlighted ml-2">{{ payingCount.toLocaleString() }}</span>
            <span v-if="appSignups.length > 0" class="text-xs text-muted ml-1">({{ Math.round((payingCount / appSignups.length) * 100) }}%)</span>
          </template>
        </div>
        <div class="bg-elevated px-4 py-2 rounded-lg">
          <span class="text-xs text-muted uppercase tracking-wide">Revenue</span>
          <UIcon v-if="isLoadingStripe" name="i-lucide-loader-2" class="size-4 animate-spin text-muted ml-2 inline-block align-middle" />
          <span v-else class="text-lg font-semibold text-emerald-600 dark:text-emerald-400 ml-2">${{ totalRevenue.toLocaleString() }}</span>
        </div>
      </div>

      <!-- App Signups Chart -->
      <div class="mb-8">
        <div class="flex items-baseline justify-between mb-4">
          <h2 class="text-sm font-medium text-highlighted">App Signups</h2>
          <span class="text-xs text-muted">Last 30 days</span>
        </div>
        <div class="bg-elevated rounded-lg p-4 pt-8 ps-12 h-72">
          <div v-if="loading" class="h-full flex items-center justify-center">
            <UIcon name="i-lucide-loader-2" class="size-5 animate-spin text-muted" />
          </div>
          <VisXYContainer
            v-else-if="appSignupsChartData.length > 0"
            :data="appSignupsChartData"
            :padding="{ top: 20 }"
            class="h-full"
          >
            <VisLine :x="chartX" :y="chartY" color="rgb(34, 197, 94)" />
            <VisArea :x="chartX" :y="chartY" color="rgb(34, 197, 94)" :opacity="0.1" />
            <VisAxis type="x" :x="chartX" :tick-format="chartXTicks" />
            <VisAxis type="y" :y="chartY" />
            <VisCrosshair color="rgb(34, 197, 94)" :template="chartTooltipTemplate" />
            <VisTooltip />
          </VisXYContainer>
          <div v-else class="h-full flex items-center justify-center text-sm text-muted">
            No app signups yet
          </div>
        </div>
      </div>

      <!-- Recent Prompts & Recent App Signups -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Prompts -->
        <div>
          <div class="flex items-baseline justify-between mb-4">
            <h2 class="text-sm font-medium text-highlighted">Recent Prompts</h2>
          </div>

          <div v-if="isLoadingActive" class="flex items-center justify-center h-32">
            <UIcon name="i-lucide-loader-2" class="size-5 animate-spin text-muted" />
          </div>

          <div v-else-if="recentPrompts.length === 0" class="text-center py-12 text-muted text-sm bg-elevated rounded-lg">
            No prompts yet
          </div>

          <div v-else class="bg-elevated rounded-lg divide-y divide-default">
            <div
              v-for="prompt in recentPrompts"
              :key="prompt.id"
              class="flex items-center gap-4 p-4"
            >
              <img
                v-if="prompt.photo"
                :src="prompt.photo"
                :alt="prompt.name || prompt.email"
                class="size-9 rounded-full object-cover shrink-0"
              />
              <div v-else class="size-9 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-sm font-medium text-muted shrink-0">
                {{ prompt.name ? prompt.name.split(' ').map((n: string) => n.charAt(0)).slice(0, 2).join('').toUpperCase() : prompt.email ? prompt.email.charAt(0).toUpperCase() : '?' }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-highlighted truncate">{{ prompt.name || prompt.email }}</p>
                <p class="text-xs text-muted truncate">{{ prompt.prompt }}</p>
              </div>
              <div class="text-xs text-muted shrink-0">
                {{ timeAgo(prompt.time) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Recent App Signups -->
        <div>
          <div class="flex items-baseline justify-between mb-4">
            <h2 class="text-sm font-medium text-highlighted">Recent App Signups</h2>
            <NuxtLink to="/app-signups" class="text-xs text-primary hover:underline">View all</NuxtLink>
          </div>

          <div v-if="loading" class="flex items-center justify-center h-32">
            <UIcon name="i-lucide-loader-2" class="size-5 animate-spin text-muted" />
          </div>

          <div v-else-if="recentAppSignups.length === 0" class="text-center py-12 text-muted text-sm bg-elevated rounded-lg">
            No app signups yet
          </div>

          <div v-else class="bg-elevated rounded-lg divide-y divide-default">
            <NuxtLink
              v-for="signup in recentAppSignups"
              :key="signup.id"
              to="/app-signups"
              class="flex items-center gap-4 p-4 hover:bg-accented/50 transition-colors"
            >
              <img
                v-if="getLinkedInPhoto(signup.linkedin_json)"
                :src="getLinkedInPhoto(signup.linkedin_json)!"
                :alt="getLinkedInName(signup.linkedin_json) || signup.json_payload.email"
                class="size-9 rounded-full object-cover shrink-0"
              />
              <div v-else class="size-9 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-sm font-medium text-muted shrink-0">
                {{ getLinkedInName(signup.linkedin_json) ? getLinkedInName(signup.linkedin_json)!.split(' ').map((n: string) => n.charAt(0)).slice(0, 2).join('').toUpperCase() : signup.json_payload.email.charAt(0).toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-highlighted truncate">{{ getLinkedInName(signup.linkedin_json) || signup.json_payload.email }}</p>
                <p v-if="signup.linkedin_json?.headline" class="text-xs text-muted truncate">{{ signup.linkedin_json.headline }}</p>
              </div>
              <div class="text-xs text-muted shrink-0">
                {{ timeAgo(signup.created_at) }}
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
.unovis-xy-container {
  --vis-crosshair-line-stroke-color: rgb(34, 197, 94);
  --vis-crosshair-circle-stroke-color: var(--ui-bg);
  --vis-axis-grid-color: var(--ui-border);
  --vis-axis-tick-color: var(--ui-border);
  --vis-axis-tick-label-color: var(--ui-text-dimmed);
  --vis-tooltip-background-color: var(--ui-bg);
  --vis-tooltip-border-color: var(--ui-border);
  --vis-tooltip-text-color: var(--ui-text-highlighted);
}
</style>
