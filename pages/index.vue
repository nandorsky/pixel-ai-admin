<script setup lang="ts">
import { sub, format, formatDistanceToNow, startOfWeek, startOfDay, eachDayOfInterval } from 'date-fns'
import { VisXYContainer, VisLine, VisAxis, VisArea, VisCrosshair, VisTooltip, VisSingleContainer, VisDonut } from '@unovis/vue'
import { Donut } from '@unovis/ts'

const supabase = useSupabase()

interface LinkedInProfilePicture {
  url: string
  width: number
  height: number
}

interface LinkedInJson {
  headline?: string
  profilePicture?: string
  profilePictures?: LinkedInProfilePicture[]
}

interface Signup {
  id: number
  email: string
  first_name: string | null
  last_name: string | null
  referral_code: string
  referred_by: string | null
  created_at: string
  utm_parameters: Record<string, string> | null
  linkedin_json: LinkedInJson | null
  product_access: boolean | null
  invite_sent_at: string | null
}

function getLinkedInPhoto(linkedin: LinkedInJson | null): string | null {
  if (!linkedin) return null
  if (linkedin.profilePicture) return linkedin.profilePicture
  if (linkedin.profilePictures?.length) {
    const preferred = linkedin.profilePictures.find(p => p.width === 100) || linkedin.profilePictures[0]
    return preferred?.url || null
  }
  return null
}

type ChartRecord = { date: Date; count: number }

const signups = ref<Signup[]>([])
const loading = ref(true)

// Stats
const totalSignups = computed(() => signups.value.length)
const invitesSent = computed(() => signups.value.filter(s => s.invite_sent_at).length)
const appSignupsRaw = ref<{ email: string; created_at: string }[]>([])
const appSignupsTotal = computed(() => appSignupsRaw.value.length)
const appSignupsFromWaitlist = computed(() => {
  const waitlistEmailSet = new Set(signups.value.map(s => s.email.toLowerCase()))
  return appSignupsRaw.value.filter(e => waitlistEmailSet.has(e.email.toLowerCase())).length
})
const referralsCount = computed(() => {
  const usedCodes = new Set(signups.value.map(s => s.referred_by).filter(Boolean))
  return signups.value.filter(s => usedCodes.has(s.referral_code)).length
})
const thisWeekSignups = computed(() => {
  const weekStart = startOfWeek(new Date())
  return signups.value.filter(s => new Date(s.created_at) >= weekStart).length
})
const todaySignups = computed(() => {
  const dayStart = startOfDay(new Date())
  return signups.value.filter(s => new Date(s.created_at) >= dayStart).length
})

onMounted(async () => {
  const [signupsResult, appSignupsResult] = await Promise.all([
    supabase
      .from('signups')
      .select('id, email, first_name, last_name, referral_code, referred_by, created_at, utm_parameters, linkedin_json, product_access, invite_sent_at')
      .order('created_at', { ascending: true }),
    supabase
      .from('app_signups')
      .select('created_at, json_payload')
  ])

  if (!signupsResult.error && signupsResult.data) {
    signups.value = signupsResult.data
  }
  appSignupsRaw.value = (appSignupsResult.data || [])
    .filter((r: any) => r.json_payload?.email)
    .map((r: any) => ({ email: r.json_payload.email, created_at: r.created_at }))
  loading.value = false
})

// Build chart data
const chartData = computed<ChartRecord[]>(() => {
  if (!signups.value.length) return []

  const range = {
    start: sub(new Date(), { days: 30 }),
    end: new Date()
  }

  const dates = eachDayOfInterval(range)
  const countsByDate = new Map<string, number>()

  // Initialize all dates with 0
  dates.forEach(date => {
    countsByDate.set(startOfDay(date).toISOString(), 0)
  })

  // Count signups per day
  signups.value.forEach(signup => {
    const signupDate = startOfDay(new Date(signup.created_at)).toISOString()
    if (countsByDate.has(signupDate)) {
      countsByDate.set(signupDate, (countsByDate.get(signupDate) || 0) + 1)
    }
  })

  // Get baseline (signups before range)
  const baseline = signups.value.filter(s => new Date(s.created_at) < range.start).length

  // Build cumulative data
  let runningTotal = baseline
  return dates.map(date => {
    runningTotal += countsByDate.get(startOfDay(date).toISOString()) || 0
    return { date, count: runningTotal }
  })
})

// Build app signups chart data
const appSignupsChartData = computed<ChartRecord[]>(() => {
  if (!appSignupsRaw.value.length) return []

  const range = {
    start: sub(new Date(), { days: 30 }),
    end: new Date()
  }

  const dates = eachDayOfInterval(range)
  const countsByDate = new Map<string, number>()

  dates.forEach(date => {
    countsByDate.set(startOfDay(date).toISOString(), 0)
  })

  appSignupsRaw.value.forEach(signup => {
    const signupDate = startOfDay(new Date(signup.created_at)).toISOString()
    if (countsByDate.has(signupDate)) {
      countsByDate.set(signupDate, (countsByDate.get(signupDate) || 0) + 1)
    }
  })

  const baseline = appSignupsRaw.value.filter(s => new Date(s.created_at) < range.start).length

  let runningTotal = baseline
  return dates.map(date => {
    runningTotal += countsByDate.get(startOfDay(date).toISOString()) || 0
    return { date, count: runningTotal }
  })
})

const appX = (_: ChartRecord, i: number) => i
const appY = (d: ChartRecord) => d.count
const appXTicks = (i: number) => {
  if (!appSignupsChartData.value[i] || i === 0 || i === appSignupsChartData.value.length - 1) return ''
  return format(appSignupsChartData.value[i].date, 'd MMM')
}
const appTooltipTemplate = (d: ChartRecord) => `${format(d.date, 'MMM d')}: ${d.count} total`

function formatName(firstName: string | null, lastName: string | null): string {
  return `${firstName || ''} ${lastName || ''}`.trim()
}

// Build referral map
const codeToUser = computed(() => {
  const map = new Map<string, { email: string; name: string }>()
  signups.value.forEach(s => map.set(s.referral_code, {
    email: s.email,
    name: formatName(s.first_name, s.last_name)
  }))
  return map
})

// Top referrers (excluding internal @metadata.io emails)
const topReferrers = computed(() => {
  const referralCounts = new Map<string, { id: number; code: string; count: number; email: string; name: string; linkedinPhoto: string | null; referredPeople: { id: number; name: string; photo: string | null }[] }>()

  // Count referrals for each referral code
  signups.value.forEach(s => {
    if (s.referred_by) {
      const referrer = signups.value.find(r => r.referral_code === s.referred_by)
      if (referrer && !referrer.email.toLowerCase().endsWith('@metadata.io') && referrer.email.toLowerCase() !== 'nate@patent355.com') {
        const referredPerson = {
          id: s.id,
          name: formatName(s.first_name, s.last_name),
          photo: getLinkedInPhoto(s.linkedin_json)
        }
        const existing = referralCounts.get(s.referred_by)
        if (existing) {
          existing.count++
          existing.referredPeople.push(referredPerson)
        } else {
          referralCounts.set(s.referred_by, {
            id: referrer.id,
            code: s.referred_by,
            count: 1,
            email: referrer.email,
            name: formatName(referrer.first_name, referrer.last_name),
            linkedinPhoto: getLinkedInPhoto(referrer.linkedin_json),
            referredPeople: [referredPerson]
          })
        }
      }
    }
  })

  return [...referralCounts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
})

// Recent signups
const recentSignups = computed(() => {
  return [...signups.value]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)
    .map(s => {
      const source = getSignupSource(s)
      return {
        id: s.id,
        email: s.email,
        name: formatName(s.first_name, s.last_name),
        source,
        sourceColor: getSourceColor(source),
        date: format(new Date(s.created_at), 'MMM d'),
        time_ago: formatDistanceToNow(new Date(s.created_at), { addSuffix: true }),
        linkedinPhoto: getLinkedInPhoto(s.linkedin_json),
        linkedinHeadline: s.linkedin_json?.headline || null
      }
    })
})

// Source breakdown for pie chart
import { calculateSourceBreakdown, getSignupSource, getSourceColor, type SourceBreakdown } from '~/utils/signup-source'

const sourceBreakdown = computed<SourceBreakdown[]>(() => calculateSourceBreakdown(signups.value))

const pieValue = (d: SourceBreakdown) => d.value
const pieColor = (d: SourceBreakdown) => d.color
const pieTooltip = (d: any, i: number) => {
  const item = sourceBreakdown.value[i]
  if (item) return `${item.value}`
  return ''
}

// Chart helpers
const x = (_: ChartRecord, i: number) => i
const y = (d: ChartRecord) => d.count
const xTicks = (i: number) => {
  if (!chartData.value[i] || i === 0 || i === chartData.value.length - 1) return ''
  return format(chartData.value[i].date, 'd MMM')
}
const tooltipTemplate = (d: ChartRecord) => `${format(d.date, 'MMM d')}: ${d.count} total`
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
      <!-- Stats Row -->
      <div class="grid grid-cols-3 lg:grid-cols-6 gap-px bg-default/50 rounded-lg mb-8">
        <div class="bg-elevated p-6">
          <p class="text-xs text-muted uppercase tracking-wide">Waitlist</p>
          <p class="text-3xl font-semibold text-highlighted mt-1">{{ totalSignups.toLocaleString() }}</p>
        </div>
        <div class="bg-elevated p-6">
          <p class="text-xs text-muted uppercase tracking-wide">Invites Sent</p>
          <p class="text-3xl font-semibold text-highlighted mt-1">{{ invitesSent.toLocaleString() }}</p>
        </div>
        <div class="bg-elevated p-6">
          <p class="text-xs text-muted uppercase tracking-wide">App Signups</p>
          <p class="text-3xl font-semibold text-highlighted mt-1">{{ appSignupsTotal.toLocaleString() }}<span class="text-lg text-muted font-normal"> / {{ invitesSent.toLocaleString() }}</span></p>
          <p v-if="invitesSent > 0" class="text-xs text-muted mt-1">{{ Math.round((appSignupsTotal / invitesSent) * 100) }}% conversion</p>
        </div>
        <div class="bg-elevated p-6">
          <p class="text-xs text-muted uppercase tracking-wide">Referrers</p>
          <p class="text-3xl font-semibold text-highlighted mt-1">{{ referralsCount.toLocaleString() }}</p>
        </div>
        <div class="bg-elevated p-6">
          <p class="text-xs text-muted uppercase tracking-wide">This Week</p>
          <p class="text-3xl font-semibold text-highlighted mt-1">{{ thisWeekSignups.toLocaleString() }}</p>
        </div>
        <div class="bg-elevated p-6">
          <p class="text-xs text-muted uppercase tracking-wide">Today</p>
          <p class="text-3xl font-semibold text-highlighted mt-1">{{ todaySignups.toLocaleString() }}</p>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <!-- Growth Chart -->
        <div class="lg:col-span-2">
          <div class="flex items-baseline justify-between mb-4">
            <h2 class="text-sm font-medium text-highlighted">Growth</h2>
            <span class="text-xs text-muted">Last 30 days</span>
          </div>
          <div class="bg-elevated rounded-lg p-4 pt-8 ps-12 h-72">
            <div v-if="loading" class="h-full flex items-center justify-center">
              <UIcon name="i-lucide-loader-2" class="size-5 animate-spin text-muted" />
            </div>
            <VisXYContainer
              v-else-if="chartData.length > 0"
              :data="chartData"
              :padding="{ top: 20 }"
              class="h-full"
            >
              <VisLine :x="x" :y="y" color="var(--ui-primary)" />
              <VisArea :x="x" :y="y" color="var(--ui-primary)" :opacity="0.1" />
              <VisAxis type="x" :x="x" :tick-format="xTicks" />
              <VisAxis type="y" :y="y" />
              <VisCrosshair color="var(--ui-primary)" :template="tooltipTemplate" />
              <VisTooltip />
            </VisXYContainer>
          </div>
        </div>

        <!-- Source Breakdown Pie Chart -->
        <div>
          <div class="flex items-baseline justify-between mb-4">
            <h2 class="text-sm font-medium text-highlighted">Sources</h2>
          </div>
          <div class="bg-elevated rounded-lg p-4 h-72">
            <div v-if="loading" class="h-full flex items-center justify-center">
              <UIcon name="i-lucide-loader-2" class="size-5 animate-spin text-muted" />
            </div>
            <div v-else-if="sourceBreakdown.length > 0" class="h-full flex flex-col overflow-hidden">
              <VisSingleContainer :data="sourceBreakdown" class="flex-1 max-h-44 donut-chart">
                <VisDonut :value="pieValue" :color="pieColor" :arc-width="30" :padAngle="0.02" />
                <VisTooltip :triggers="{ [Donut.selectors.segment]: pieTooltip }" />
              </VisSingleContainer>
              <div class="flex flex-wrap justify-center gap-3 mt-2">
                <div v-for="source in sourceBreakdown" :key="source.label" class="flex items-center gap-1.5 text-xs">
                  <span class="size-2.5 rounded-full" :style="{ backgroundColor: source.color }" />
                  <span class="text-muted">{{ source.label }}</span>
                  <span class="text-highlighted font-medium">{{ source.value }}</span>
                </div>
              </div>
            </div>
          </div>
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
            <VisLine :x="appX" :y="appY" color="rgb(34, 197, 94)" />
            <VisArea :x="appX" :y="appY" color="rgb(34, 197, 94)" :opacity="0.1" />
            <VisAxis type="x" :x="appX" :tick-format="appXTicks" />
            <VisAxis type="y" :y="appY" />
            <VisCrosshair color="rgb(34, 197, 94)" :template="appTooltipTemplate" />
            <VisTooltip />
          </VisXYContainer>
          <div v-else class="h-full flex items-center justify-center text-sm text-muted">
            No app signups yet
          </div>
        </div>
      </div>

      <!-- Top Referrers & Recent Signups -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Top Referrers -->
        <div>
          <div class="flex items-baseline justify-between mb-4">
            <h2 class="text-sm font-medium text-highlighted">Top Referrers</h2>
          </div>

          <div v-if="loading" class="flex items-center justify-center h-32">
            <UIcon name="i-lucide-loader-2" class="size-5 animate-spin text-muted" />
          </div>

          <div v-else-if="topReferrers.length === 0" class="text-center py-12 text-muted text-sm bg-elevated rounded-lg">
            No referrals yet
          </div>

          <div v-else class="bg-elevated rounded-lg divide-y divide-default">
            <NuxtLink
              v-for="referrer in topReferrers"
              :key="referrer.code"
              :to="`/signups/${referrer.id}`"
              class="flex items-center gap-4 p-4 hover:bg-accented/50 transition-colors"
            >
              <img
                v-if="referrer.linkedinPhoto"
                :src="referrer.linkedinPhoto"
                :alt="referrer.name || referrer.email"
                class="size-9 rounded-full object-cover shrink-0"
              />
              <div v-else class="size-9 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-sm font-medium text-muted shrink-0">
                {{ referrer.name ? referrer.name.split(' ').map(n => n.charAt(0)).slice(0, 2).join('').toUpperCase() : referrer.email.charAt(0).toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-highlighted truncate">{{ referrer.name || referrer.email }}</p>
                <div class="flex items-center gap-1.5 mt-1">
                  <UIcon name="i-lucide-arrow-right" class="size-3 text-muted shrink-0" />
                  <div class="flex -space-x-1">
                    <template v-for="(person, idx) in referrer.referredPeople.slice(0, 5)" :key="person.id">
                      <img
                        v-if="person.photo"
                        :src="person.photo"
                        :alt="person.name"
                        :title="person.name"
                        class="size-5 rounded-full object-cover"
                        :style="{ zIndex: 5 - idx }"
                      />
                      <div
                        v-else
                        :title="person.name"
                        class="size-5 rounded-full bg-neutral-300 dark:bg-neutral-600 flex items-center justify-center text-xs font-medium text-muted"
                        :style="{ zIndex: 5 - idx }"
                      >
                        {{ person.name ? person.name.charAt(0).toUpperCase() : '?' }}
                      </div>
                    </template>
                    <div
                      v-if="referrer.referredPeople.length > 5"
                      class="size-5 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-medium text-muted"
                    >
                      +{{ referrer.referredPeople.length - 5 }}
                    </div>
                  </div>
                </div>
              </div>
              <div class="text-right shrink-0">
                <p class="text-lg font-semibold text-highlighted">{{ referrer.count }}</p>
                <p class="text-xs text-muted">{{ referrer.count === 1 ? 'referral' : 'referrals' }}</p>
              </div>
            </NuxtLink>
          </div>
        </div>

        <!-- Recent Signups -->
        <div>
          <div class="flex items-baseline justify-between mb-4">
            <h2 class="text-sm font-medium text-highlighted">Recent Signups</h2>
            <NuxtLink to="/signups" class="text-xs text-primary hover:underline">View all</NuxtLink>
          </div>

          <div v-if="loading" class="flex items-center justify-center h-32">
            <UIcon name="i-lucide-loader-2" class="size-5 animate-spin text-muted" />
          </div>

          <div v-else-if="recentSignups.length === 0" class="text-center py-12 text-muted text-sm">
            No signups yet
          </div>

          <div v-else class="bg-elevated rounded-lg divide-y divide-default">
            <NuxtLink
              v-for="signup in recentSignups"
              :key="signup.id"
              :to="`/signups/${signup.id}`"
              class="flex items-center gap-4 p-4 hover:bg-accented/50 transition-colors"
            >
              <img
                v-if="signup.linkedinPhoto"
                :src="signup.linkedinPhoto"
                :alt="signup.name || signup.email"
                class="size-9 rounded-full object-cover shrink-0"
              />
              <div v-else class="size-9 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-sm font-medium text-muted shrink-0">
                {{ signup.name ? signup.name.split(' ').map(n => n.charAt(0)).slice(0, 2).join('').toUpperCase() : signup.email.charAt(0).toUpperCase() }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-highlighted truncate">{{ signup.name || signup.email }}</p>
                <p v-if="signup.linkedinHeadline" class="text-xs text-muted truncate">{{ signup.linkedinHeadline }}</p>
                <span
                  class="inline-flex items-center px-1.5 py-0.5 rounded text-xs text-white mt-1"
                  :style="{ backgroundColor: signup.sourceColor }"
                >
                  {{ signup.source }}
                </span>
              </div>
              <div class="text-xs text-muted shrink-0">
                {{ signup.time_ago }}
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

<style scoped>
.unovis-xy-container,
.donut-chart {
  --vis-crosshair-line-stroke-color: var(--ui-primary);
  --vis-crosshair-circle-stroke-color: var(--ui-bg);
  --vis-axis-grid-color: var(--ui-border);
  --vis-axis-tick-color: var(--ui-border);
  --vis-axis-tick-label-color: var(--ui-text-dimmed);
  --vis-tooltip-background-color: var(--ui-bg);
  --vis-tooltip-border-color: var(--ui-border);
  --vis-tooltip-text-color: var(--ui-text-highlighted);
}
</style>
