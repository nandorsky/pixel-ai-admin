<script setup lang="ts">
import { sub, formatDistanceToNow } from 'date-fns'
import type { Period, Range } from '~/types'

const supabase = useSupabase()

interface Signup {
  id: number
  email: string
  referral_code: string
  referred_by: string | null
  created_at: string
}

interface ActivityItem {
  id: number
  email: string
  referrer_email: string | null
  created_at: string
  time_ago: string
}

const range = shallowRef<Range>({
  start: sub(new Date(), { days: 14 }),
  end: new Date()
})
const period = ref<Period>('daily')

const toast = useToast()
const signups = ref<Signup[]>([])
const loading = ref(true)

async function fetchSignups() {
  loading.value = true

  const { data, error } = await supabase
    .from('signups')
    .select('id, email, referral_code, referred_by, created_at')
    .order('created_at', { ascending: true })

  if (error) {
    toast.add({
      title: 'Error fetching data',
      description: error.message,
      color: 'error'
    })
  } else {
    signups.value = data || []
  }

  loading.value = false
}

// Recent activity - signups with referrer info
const recentActivity = computed<ActivityItem[]>(() => {
  // Build code to email map
  const codeToEmail = new Map<string, string>()
  signups.value.forEach(s => codeToEmail.set(s.referral_code, s.email))

  // Get recent signups sorted by date descending, limit to 10
  return [...signups.value]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map(s => ({
      id: s.id,
      email: s.email,
      referrer_email: s.referred_by ? codeToEmail.get(s.referred_by) || null : null,
      created_at: s.created_at,
      time_ago: formatDistanceToNow(new Date(s.created_at), { addSuffix: true })
    }))
})

onMounted(() => {
  fetchSignups()
})
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Home">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <HomeDateRangePicker v-model="range" class="-ms-1" />
          <HomePeriodSelect v-model="period" :range="range" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <HomeStats :period="period" :range="range" />

      <div class="flex flex-col lg:flex-row gap-6">
        <!-- Chart -->
        <div class="flex-1 min-w-0">
          <HomeChart :period="period" :range="range" />
        </div>

        <!-- Recent Activity -->
        <div class="w-full lg:w-80 shrink-0">
          <h3 class="text-lg font-semibold text-highlighted mb-4">Recent Activity</h3>

          <div v-if="loading" class="flex items-center justify-center h-32">
            <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-muted" />
          </div>

          <div v-else-if="recentActivity.length === 0" class="text-center py-8 text-muted">
            No recent activity
          </div>

          <div v-else class="relative">
            <!-- Timeline line -->
            <div class="absolute left-4 top-0 bottom-0 w-px bg-default" />

            <div class="space-y-0">
              <div
                v-for="(activity, index) in recentActivity"
                :key="activity.id"
                class="relative flex gap-4 pb-6 last:pb-0"
              >
                <!-- Timeline dot -->
                <div class="relative z-10 flex items-center justify-center size-8 rounded-full bg-elevated border-2 border-default text-xs font-medium text-muted">
                  {{ activity.email.charAt(0).toUpperCase() }}
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0 pt-0.5">
                  <p class="text-sm text-highlighted truncate">
                    <span class="font-medium">{{ activity.email }}</span>
                    <span class="text-muted"> signed up</span>
                  </p>
                  <p class="text-xs text-muted mt-0.5">
                    <span v-if="activity.referrer_email">
                      via {{ activity.referrer_email }}
                    </span>
                    <span v-else>
                      Direct
                    </span>
                    <span class="mx-1">·</span>
                    <span>{{ activity.time_ago }}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
