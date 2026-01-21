<script setup lang="ts">
import { sub, format, formatDistanceToNow, startOfWeek, startOfDay, eachDayOfInterval } from 'date-fns'
import { VisXYContainer, VisLine, VisAxis, VisArea, VisCrosshair, VisTooltip, VisSingleContainer, VisDonut } from '@unovis/vue'
import { Donut } from '@unovis/ts'

const supabase = useSupabase()

interface Signup {
  id: number
  email: string
  first_name: string | null
  last_name: string | null
  referral_code: string
  referred_by: string | null
  created_at: string
  utm_parameters: Record<string, string> | null
}

type ChartRecord = { date: Date; count: number }

const signups = ref<Signup[]>([])
const loading = ref(true)

// Stats
const totalSignups = computed(() => signups.value.length)
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
  const { data, error } = await supabase
    .from('signups')
    .select('id, email, first_name, last_name, referral_code, referred_by, created_at, utm_parameters')
    .order('created_at', { ascending: true })

  if (!error && data) {
    signups.value = data
  }
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

// Recent signups
const recentSignups = computed(() => {
  return [...signups.value]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)
    .map(s => {
      const referrer = s.referred_by ? codeToUser.value.get(s.referred_by) : null
      const hasUtm = s.utm_parameters && Object.keys(s.utm_parameters).length > 0
      const utmSource = s.utm_parameters?.utm_medium || null
      return {
        id: s.id,
        email: s.email,
        name: formatName(s.first_name, s.last_name),
        referrer: referrer?.name || referrer?.email || null,
        hasUtm,
        utmSource,
        date: format(new Date(s.created_at), 'MMM d'),
        time_ago: formatDistanceToNow(new Date(s.created_at), { addSuffix: true })
      }
    })
})

// Source breakdown for pie chart
import { calculateSourceBreakdown, type SourceBreakdown } from '~/utils/signup-source'

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
      <div class="grid grid-cols-4 gap-px bg-default/50 rounded-lg mb-8">
        <div class="bg-elevated p-6">
          <p class="text-xs text-muted uppercase tracking-wide">Signups</p>
          <p class="text-3xl font-semibold text-highlighted mt-1">{{ totalSignups.toLocaleString() }}</p>
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
            <div class="size-9 rounded-full bg-default flex items-center justify-center text-sm font-medium text-muted shrink-0">
              {{ (signup.name || signup.email).charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-highlighted truncate">{{ signup.name || signup.email }}</p>
              <p class="text-xs text-muted truncate">
                <span v-if="signup.referrer">via {{ signup.referrer }}</span>
                <span v-else-if="signup.hasUtm">via {{ signup.utmSource || 'paid ad' }} paid ad campaign</span>
                <span v-else>via drect</span>
              </p>
            </div>
            <div class="text-xs text-muted shrink-0">
              {{ signup.time_ago }}
            </div>
          </NuxtLink>
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
