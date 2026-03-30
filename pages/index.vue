<script setup lang="ts">
import { sub, format, formatDistanceToNow, startOfDay, eachDayOfInterval, getISOWeek, getISOWeekYear } from 'date-fns'
import { VisXYContainer, VisLine, VisAxis, VisArea, VisCrosshair, VisTooltip } from '@unovis/vue'

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

type ChartRecord = { date: Date; count: number }

// Dashboard state
const loading = ref(true)
const refreshing = ref(false)
const cachedAt = ref<string | null>(null)

const signups = ref<AppSignup[]>([])
const activeEmails = ref<Set<string>>(new Set())
const stripeSpend = ref<Record<string, number>>({})
const recentTraces = ref<any[]>([])
const tracesByEmail = ref<Record<string, number>>({})
const traceDaysByEmail = ref<Record<string, string[]>>({})

// Helpers
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

function getInitials(name: string | null, email: string): string {
  if (name) return name.split(' ').map(n => n.charAt(0)).slice(0, 2).join('').toUpperCase()
  return email ? email.charAt(0).toUpperCase() : '?'
}

// Get today's date as YYYY-MM-DD
const todayStr = format(new Date(), 'yyyy-MM-dd')
const sevenDaysAgoStr = format(sub(new Date(), { days: 7 }), 'yyyy-MM-dd')

// Helper: get ISO week key from a YYYY-MM-DD string
function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${getISOWeekYear(d)}-W${getISOWeek(d)}`
}

// Helper: get set of signup emails
const signupEmails = computed(() => {
  return new Set(signups.value.map(s => s.json_payload?.email?.toLowerCase()).filter(Boolean))
})

// ── Core stats ──

const signupCount = computed(() => signups.value.length)

// DAU: users who ran at least 1 prompt today
const dauCount = computed(() => {
  let count = 0
  for (const [email, days] of Object.entries(traceDaysByEmail.value)) {
    if (days.includes(todayStr) && signupEmails.value.has(email)) count++
  }
  return count
})

// WAU: users who ran at least 1 prompt in the last 7 days
const wauCount = computed(() => {
  let count = 0
  for (const [email, days] of Object.entries(traceDaysByEmail.value)) {
    if (!signupEmails.value.has(email)) continue
    if (days.some(d => d >= sevenDaysAgoStr)) count++
  }
  return count
})

// Active: users with 2+ total sessions (not one-time tire-kickers)
const activeCount = computed(() => {
  let count = 0
  for (const [email, total] of Object.entries(tracesByEmail.value)) {
    if (total >= 2 && signupEmails.value.has(email)) count++
  }
  return count
})

// Retained: users who used the product in 2+ distinct ISO weeks
const retainedCount = computed(() => {
  let count = 0
  for (const [email, days] of Object.entries(traceDaysByEmail.value)) {
    if (!signupEmails.value.has(email)) continue
    const weeks = new Set(days.map(getWeekKey))
    if (weeks.size >= 2) count++
  }
  return count
})

const payingCount = computed(() => {
  return signups.value.filter(s => stripeSpend.value[s.json_payload?.email?.toLowerCase()]).length
})

const totalRevenue = computed(() => {
  return Object.values(stripeSpend.value).reduce((sum, amount) => sum + amount, 0)
})

// 30-day change calculations
const thirtyDaysAgo = sub(new Date(), { days: 30 })
const sixtyDaysAgo = sub(new Date(), { days: 60 })

const signups30d = computed(() => {
  return signups.value.filter(s => new Date(s.created_at) >= thirtyDaysAgo).length
})

const signupsPrev30d = computed(() => {
  return signups.value.filter(s => {
    const d = new Date(s.created_at)
    return d >= sixtyDaysAgo && d < thirtyDaysAgo
  }).length
})

const signupChange = computed(() => signups30d.value - signupsPrev30d.value)

// Chart data: Signups (30-day cumulative)
const signupsChartData = computed<ChartRecord[]>(() => {
  if (!signups.value.length) return []
  const range = { start: thirtyDaysAgo, end: new Date() }
  const dates = eachDayOfInterval(range)
  const countsByDate = new Map<string, number>()
  dates.forEach(date => countsByDate.set(startOfDay(date).toISOString(), 0))
  signups.value.forEach(signup => {
    const key = startOfDay(new Date(signup.created_at)).toISOString()
    if (countsByDate.has(key)) countsByDate.set(key, (countsByDate.get(key) || 0) + 1)
  })
  const baseline = signups.value.filter(s => new Date(s.created_at) < range.start).length
  let total = baseline
  return dates.map(date => {
    total += countsByDate.get(startOfDay(date).toISOString()) || 0
    return { date, count: total }
  })
})

// Chart data: DAU over last 30 days
const dauChartData = computed<ChartRecord[]>(() => {
  const range = { start: thirtyDaysAgo, end: new Date() }
  const dates = eachDayOfInterval(range)
  return dates.map(date => {
    const dayStr = format(date, 'yyyy-MM-dd')
    let count = 0
    for (const [email, days] of Object.entries(traceDaysByEmail.value)) {
      if (days.includes(dayStr) && signupEmails.value.has(email)) count++
    }
    return { date, count }
  })
})

const chartX = (_: ChartRecord, i: number) => i
const chartY = (d: ChartRecord) => d.count
const chartXTicks = (data: ChartRecord[]) => (i: number) => {
  if (!data[i] || i === 0 || i === data.length - 1) return ''
  return format(data[i].date, 'd MMM')
}
const chartTooltip = (label: string) => (d: ChartRecord) => `${format(d.date, 'MMM d')}: ${d.count} ${label}`

// Email -> signup lookup
const signupByEmail = computed(() => {
  const map: Record<string, AppSignup> = {}
  for (const s of signups.value) {
    const email = s.json_payload?.email?.toLowerCase()
    if (email) map[email] = s
  }
  return map
})

// Recent prompts
const recentPrompts = computed(() => {
  return recentTraces.value
    .map(trace => {
      const email = (trace.metadata?.user_email || trace.metadata?.user_meail || '').toLowerCase()
      const signup = signupByEmail.value[email]
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

// Recent signups
const recentAppSignups = computed(() => signups.value.slice(0, 8))

// Cache freshness
const cacheAge = computed(() => {
  if (!cachedAt.value) return null
  return timeAgo(cachedAt.value)
})

// Data fetching
async function loadDashboard() {
  loading.value = true
  try {
    const result = await $fetch<any>('/api/dashboard/stats')
    signups.value = result.signups || []
    activeEmails.value = new Set(result.activeEmails || [])
    stripeSpend.value = result.stripeSpend || {}
    recentTraces.value = result.recentTraces || []
    tracesByEmail.value = result.tracesByEmail || {}
    traceDaysByEmail.value = result.traceDaysByEmail || {}
    cachedAt.value = result.cachedAt || null
  } catch (err) {
    console.error('Failed to load dashboard:', err)
  }
  loading.value = false
}

async function refreshDashboard() {
  refreshing.value = true
  try {
    await $fetch('/api/dashboard/refresh', { method: 'POST' })
    await loadDashboard()
  } catch (err) {
    console.error('Failed to refresh dashboard:', err)
  }
  refreshing.value = false
}

onMounted(() => {
  loadDashboard()
})
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <div class="flex items-center gap-3">
            <span v-if="cacheAge && !loading" class="text-xs text-muted">
              Updated {{ cacheAge }}
            </span>
            <UButton
              icon="i-lucide-refresh-cw"
              size="sm"
              variant="ghost"
              color="neutral"
              :loading="refreshing"
              @click="refreshDashboard"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Skeleton loading -->
      <template v-if="loading">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div v-for="i in 4" :key="i" class="bg-elevated rounded-lg p-5 animate-pulse">
            <div class="h-3 w-16 bg-neutral-200 dark:bg-neutral-700 rounded mb-3" />
            <div class="h-7 w-24 bg-neutral-200 dark:bg-neutral-700 rounded mb-2" />
            <div class="h-3 w-20 bg-neutral-200 dark:bg-neutral-700 rounded" />
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div v-for="i in 3" :key="i" class="bg-elevated rounded-lg p-5 animate-pulse">
            <div class="h-3 w-16 bg-neutral-200 dark:bg-neutral-700 rounded mb-3" />
            <div class="h-7 w-20 bg-neutral-200 dark:bg-neutral-700 rounded" />
          </div>
        </div>
        <div class="bg-elevated rounded-lg p-6 mb-6 animate-pulse h-40" />
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div class="bg-elevated rounded-lg p-6 animate-pulse h-72" />
          <div class="bg-elevated rounded-lg p-6 animate-pulse h-72" />
        </div>
      </template>

      <template v-else>
        <!-- Row 1: Signups, Paying, Revenue + Signup change -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <!-- Signups -->
          <div class="bg-elevated rounded-lg p-5">
            <div class="flex items-center gap-2 mb-1">
              <UIcon name="i-lucide-user-plus" class="size-4 text-primary" />
              <span class="text-xs text-muted uppercase tracking-wide">Signups</span>
            </div>
            <p class="text-2xl font-semibold text-highlighted">{{ signupCount.toLocaleString() }}</p>
            <p class="text-xs mt-1" :class="signupChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'">
              {{ signupChange >= 0 ? '+' : '' }}{{ signupChange }} last 30d
            </p>
          </div>

          <!-- Paying -->
          <div class="bg-elevated rounded-lg p-5">
            <div class="flex items-center gap-2 mb-1">
              <UIcon name="i-lucide-credit-card" class="size-4 text-violet-500" />
              <span class="text-xs text-muted uppercase tracking-wide">Paying</span>
            </div>
            <p class="text-2xl font-semibold text-highlighted">
              {{ payingCount.toLocaleString() }}
              <span v-if="signupCount > 0" class="text-sm font-normal text-muted">({{ Math.round((payingCount / signupCount) * 100) }}%)</span>
            </p>
            <p class="text-xs text-muted mt-1">has a Stripe charge</p>
          </div>

          <!-- Revenue -->
          <div class="bg-elevated rounded-lg p-5">
            <div class="flex items-center gap-2 mb-1">
              <UIcon name="i-lucide-dollar-sign" class="size-4 text-emerald-500" />
              <span class="text-xs text-muted uppercase tracking-wide">Revenue</span>
            </div>
            <p class="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
              ${{ totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }}
            </p>
            <p class="text-xs text-muted mt-1">all time from Stripe</p>
          </div>

          <!-- DAU (highlight card) -->
          <div class="bg-elevated rounded-lg p-5 ring-1 ring-primary/20">
            <div class="flex items-center gap-2 mb-1">
              <UIcon name="i-lucide-zap" class="size-4 text-amber-500" />
              <span class="text-xs text-muted uppercase tracking-wide">DAU</span>
            </div>
            <p class="text-2xl font-semibold text-highlighted">{{ dauCount.toLocaleString() }}</p>
            <p class="text-xs text-muted mt-1">ran a prompt today</p>
          </div>
        </div>

        <!-- Row 2: Usage metrics with definitions -->
        <div class="grid grid-cols-3 gap-4 mb-6">
          <!-- WAU -->
          <div class="bg-elevated rounded-lg p-5">
            <div class="flex items-center gap-2 mb-1">
              <UIcon name="i-lucide-calendar-days" class="size-4 text-blue-500" />
              <span class="text-xs text-muted uppercase tracking-wide">WAU</span>
            </div>
            <p class="text-2xl font-semibold text-highlighted">{{ wauCount.toLocaleString() }}</p>
            <p class="text-xs text-muted mt-1">ran a prompt in last 7 days</p>
          </div>

          <!-- Active (2+ sessions) -->
          <div class="bg-elevated rounded-lg p-5">
            <div class="flex items-center gap-2 mb-1">
              <UIcon name="i-lucide-activity" class="size-4 text-cyan-500" />
              <span class="text-xs text-muted uppercase tracking-wide">Active</span>
            </div>
            <p class="text-2xl font-semibold text-highlighted">
              {{ activeCount.toLocaleString() }}
              <span v-if="signupCount > 0" class="text-sm font-normal text-muted">({{ Math.round((activeCount / signupCount) * 100) }}%)</span>
            </p>
            <p class="text-xs text-muted mt-1">2+ prompts all-time</p>
          </div>

          <!-- Retained -->
          <div class="bg-elevated rounded-lg p-5">
            <div class="flex items-center gap-2 mb-1">
              <UIcon name="i-lucide-shield-check" class="size-4 text-emerald-500" />
              <span class="text-xs text-muted uppercase tracking-wide">Retained</span>
            </div>
            <p class="text-2xl font-semibold text-highlighted">
              {{ retainedCount.toLocaleString() }}
              <span v-if="activeCount > 0" class="text-sm font-normal text-muted">({{ Math.round((retainedCount / activeCount) * 100) }}% of active)</span>
            </p>
            <p class="text-xs text-muted mt-1">used in 2+ separate weeks</p>
          </div>
        </div>

        <!-- Conversion Funnel -->
        <div class="mb-6">
          <HomeFunnel
            :signups="signupCount"
            :active="activeCount"
            :paying="payingCount"
          />
        </div>

        <!-- Dual Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <!-- Signups Chart -->
          <div class="bg-elevated rounded-lg p-4 pt-6 ps-10">
            <div class="flex items-baseline justify-between mb-3 ps-2">
              <h3 class="text-sm font-medium text-highlighted">Cumulative Signups</h3>
              <span class="text-xs text-muted">Last 30 days</span>
            </div>
            <div class="h-56">
              <VisXYContainer
                v-if="signupsChartData.length > 0"
                :data="signupsChartData"
                :padding="{ top: 20 }"
                class="h-full"
              >
                <VisLine :x="chartX" :y="chartY" color="rgb(34, 197, 94)" />
                <VisArea :x="chartX" :y="chartY" color="rgb(34, 197, 94)" :opacity="0.1" />
                <VisAxis type="x" :x="chartX" :tick-format="chartXTicks(signupsChartData)" />
                <VisAxis type="y" :y="chartY" />
                <VisCrosshair color="rgb(34, 197, 94)" :template="chartTooltip('total signups')" />
                <VisTooltip />
              </VisXYContainer>
              <div v-else class="h-full flex items-center justify-center text-sm text-muted">
                No signup data
              </div>
            </div>
          </div>

          <!-- DAU Chart -->
          <div class="bg-elevated rounded-lg p-4 pt-6 ps-10">
            <div class="flex items-baseline justify-between mb-3 ps-2">
              <h3 class="text-sm font-medium text-highlighted">Daily Active Users</h3>
              <span class="text-xs text-muted">Last 30 days</span>
            </div>
            <div class="h-56">
              <VisXYContainer
                v-if="dauChartData.length > 0"
                :data="dauChartData"
                :padding="{ top: 20 }"
                class="h-full"
              >
                <VisLine :x="chartX" :y="chartY" color="rgb(59, 130, 246)" />
                <VisArea :x="chartX" :y="chartY" color="rgb(59, 130, 246)" :opacity="0.1" />
                <VisAxis type="x" :x="chartX" :tick-format="chartXTicks(dauChartData)" />
                <VisAxis type="y" :y="chartY" />
                <VisCrosshair color="rgb(59, 130, 246)" :template="chartTooltip('active users')" />
                <VisTooltip />
              </VisXYContainer>
              <div v-else class="h-full flex items-center justify-center text-sm text-muted">
                No usage data
              </div>
            </div>
          </div>
        </div>

        <!-- Metric Definitions -->
        <div class="mb-6 bg-elevated rounded-lg p-5">
          <h3 class="text-xs font-medium text-muted uppercase tracking-wide mb-3">Metric Definitions</h3>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 text-xs text-muted">
            <div><span class="font-medium text-highlighted">DAU</span> — ran at least 1 prompt today</div>
            <div><span class="font-medium text-highlighted">WAU</span> — ran at least 1 prompt in the last 7 days</div>
            <div><span class="font-medium text-highlighted">Active</span> — ran 2+ prompts all-time (excludes one-time users)</div>
            <div><span class="font-medium text-highlighted">Retained</span> — used the product in 2+ separate calendar weeks</div>
          </div>
        </div>

        <!-- Recent Prompts & Signups -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Recent Prompts -->
          <div>
            <div class="flex items-baseline justify-between mb-4">
              <h3 class="text-sm font-medium text-highlighted">Recent Prompts</h3>
            </div>
            <div v-if="recentPrompts.length === 0" class="text-center py-12 text-muted text-sm bg-elevated rounded-lg">
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
                  {{ getInitials(prompt.name, prompt.email) }}
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

          <!-- Recent Signups -->
          <div>
            <div class="flex items-baseline justify-between mb-4">
              <h3 class="text-sm font-medium text-highlighted">Recent Signups</h3>
              <NuxtLink to="/app-signups" class="text-xs text-primary hover:underline">View all</NuxtLink>
            </div>
            <div v-if="recentAppSignups.length === 0" class="text-center py-12 text-muted text-sm bg-elevated rounded-lg">
              No signups yet
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
                  {{ getInitials(getLinkedInName(signup.linkedin_json), signup.json_payload.email) }}
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
