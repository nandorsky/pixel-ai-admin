<script setup lang="ts">
import { eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, format, startOfDay, startOfWeek, startOfMonth } from 'date-fns'
import { VisXYContainer, VisLine, VisAxis, VisArea, VisCrosshair, VisTooltip } from '@unovis/vue'
import { useElementSize } from '@vueuse/core'
import type { Period, Range } from '~/types'

const supabase = useSupabase()

const cardRef = useTemplateRef<HTMLElement | null>('cardRef')

const props = defineProps<{
  period: Period
  range: Range
}>()

type DataRecord = {
  date: Date
  count: number
}

const { width } = useElementSize(cardRef)

const data = ref<DataRecord[]>([])
const loading = ref(true)

async function fetchSignups() {
  loading.value = true

  // Fetch signups within range and count of signups before range (for baseline)
  const [rangeResult, baselineResult] = await Promise.all([
    supabase
      .from('signups')
      .select('created_at')
      .gte('created_at', props.range.start.toISOString())
      .lte('created_at', props.range.end.toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('signups')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', props.range.start.toISOString())
  ])

  if (rangeResult.error) {
    console.error('Error fetching signups:', rangeResult.error)
    loading.value = false
    return
  }

  const signups = rangeResult.data
  const baseline = baselineResult.count || 0

  // Get all dates in the range based on period
  const intervalFn = ({
    daily: eachDayOfInterval,
    weekly: eachWeekOfInterval,
    monthly: eachMonthOfInterval
  } as Record<Period, typeof eachDayOfInterval>)[props.period]

  const startFn = ({
    daily: startOfDay,
    weekly: startOfWeek,
    monthly: startOfMonth
  } as Record<Period, typeof startOfDay>)[props.period]

  const dates = intervalFn(props.range)

  // Count signups per period
  const countsByDate = new Map<string, number>()

  // Initialize all dates with 0
  dates.forEach(date => {
    countsByDate.set(startFn(date).toISOString(), 0)
  })

  // Count signups
  signups?.forEach(signup => {
    const signupDate = startFn(new Date(signup.created_at)).toISOString()
    if (countsByDate.has(signupDate)) {
      countsByDate.set(signupDate, (countsByDate.get(signupDate) || 0) + 1)
    }
  })

  // Convert to array with cumulative totals (starting from baseline)
  let runningTotal = baseline
  data.value = dates.map(date => {
    runningTotal += countsByDate.get(startFn(date).toISOString()) || 0
    return {
      date,
      count: runningTotal
    }
  })

  loading.value = false
}

watch([() => props.period, () => props.range], () => {
  fetchSignups()
}, { immediate: true })

const x = (_: DataRecord, i: number) => i
const y = (d: DataRecord) => d.count

const total = computed(() => data.value.length > 0 ? data.value[data.value.length - 1].count : 0)

const formatDate = (date: Date): string => {
  return ({
    daily: format(date, 'd MMM'),
    weekly: format(date, 'd MMM'),
    monthly: format(date, 'MMM yyy')
  })[props.period]
}

const xTicks = (i: number) => {
  if (i === 0 || i === data.value.length - 1 || !data.value[i]) {
    return ''
  }

  return formatDate(data.value[i].date)
}

const template = (d: DataRecord) => `${formatDate(d.date)}: ${d.count} total signup${d.count !== 1 ? 's' : ''}`
</script>

<template>
  <UCard ref="cardRef" :ui="{ root: 'overflow-visible', body: '!px-0 !pt-0 !pb-3' }">
    <template #header>
      <div>
        <p class="text-xs text-muted uppercase mb-1.5">
          Total Signups
        </p>
        <p class="text-3xl text-highlighted font-semibold">
          {{ total.toLocaleString() }}
        </p>
      </div>
    </template>

    <VisXYContainer
      :data="data"
      :padding="{ top: 40 }"
      class="h-96"
      :width="width"
    >
      <VisLine
        :x="x"
        :y="y"
        color="var(--ui-primary)"
      />
      <VisArea
        :x="x"
        :y="y"
        color="var(--ui-primary)"
        :opacity="0.1"
      />

      <VisAxis
        type="x"
        :x="x"
        :tick-format="xTicks"
      />

      <VisCrosshair
        color="var(--ui-primary)"
        :template="template"
      />

      <VisTooltip />
    </VisXYContainer>
  </UCard>
</template>

<style scoped>
.unovis-xy-container {
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
