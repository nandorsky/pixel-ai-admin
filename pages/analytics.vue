<script setup lang="ts">
const toast = useToast()

interface DeviceBreakdown {
  device: string
  count: number
  percent: number
}

const breakdown = ref<DeviceBreakdown[]>([])
const total = ref(0)
const isLoading = ref(true)
const error = ref<string | null>(null)

const deviceIcons: Record<string, string> = {
  Desktop: 'i-lucide-monitor',
  Mobile: 'i-lucide-smartphone',
  Tablet: 'i-lucide-tablet',
  Robot: 'i-lucide-bot',
  Unknown: 'i-lucide-help-circle'
}

const deviceColors: Record<string, string> = {
  Desktop: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  Mobile: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  Tablet: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  Robot: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200',
  Unknown: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200'
}

async function fetchBreakdown() {
  isLoading.value = true
  error.value = null
  try {
    const result = await $fetch<any>('/api/fullstory/device-breakdown')
    total.value = result.total || 0
    breakdown.value = result.breakdown || []
  } catch (err: any) {
    error.value = err.message || 'Failed to load analytics'
    toast.add({
      title: 'Error loading analytics',
      description: err.message || 'Failed to fetch FullStory data',
      color: 'error'
    })
  }
  isLoading.value = false
}

onMounted(() => {
  fetchBreakdown()
})
</script>

<template>
  <UDashboardPanel id="analytics">
    <template #header>
      <UDashboardNavbar title="Analytics">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            size="sm"
            :loading="isLoading"
            @click="fetchBreakdown"
          >
            Refresh
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-24 gap-3">
        <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-muted" />
        <p class="text-sm text-muted">Loading FullStory data... this may take a moment</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="flex flex-col items-center justify-center py-24 gap-3">
        <UIcon name="i-lucide-alert-circle" class="size-6 text-red-500" />
        <p class="text-sm text-muted">{{ error }}</p>
        <UButton size="sm" @click="fetchBreakdown">Retry</UButton>
      </div>

      <!-- Results -->
      <div v-else class="max-w-2xl mx-auto">
        <!-- Total -->
        <div class="bg-elevated px-4 py-3 rounded-lg mb-6">
          <span class="text-xs text-muted uppercase tracking-wide">Total Sessions</span>
          <span class="text-2xl font-semibold text-highlighted ml-3">{{ total.toLocaleString() }}</span>
        </div>

        <!-- Breakdown -->
        <div class="space-y-3">
          <div
            v-for="item in breakdown"
            :key="item.device"
            class="bg-elevated rounded-lg p-4"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  :class="deviceColors[item.device] || deviceColors.Unknown"
                >
                  <UIcon :name="deviceIcons[item.device] || deviceIcons.Unknown" class="size-5" />
                </div>
                <div>
                  <div class="font-medium text-highlighted">{{ item.device }}</div>
                  <div class="text-xs text-muted">{{ item.count.toLocaleString() }} sessions</div>
                </div>
              </div>
              <div class="text-2xl font-semibold text-highlighted">{{ item.percent }}%</div>
            </div>
            <!-- Progress bar -->
            <div class="w-full h-2 rounded-full bg-default">
              <div
                class="h-2 rounded-full transition-all duration-500"
                :class="{
                  'bg-blue-500': item.device === 'Desktop',
                  'bg-green-500': item.device === 'Mobile',
                  'bg-purple-500': item.device === 'Tablet',
                  'bg-neutral-400': item.device !== 'Desktop' && item.device !== 'Mobile' && item.device !== 'Tablet'
                }"
                :style="{ width: `${item.percent}%` }"
              />
            </div>
          </div>
        </div>

        <div v-if="breakdown.length === 0" class="text-center py-12 text-muted text-sm">
          No session data found
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
