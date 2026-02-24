<script setup lang="ts">
const toast = useToast()

interface FullStorySession {
  sessionId: string
  createdTime: number
  fsUrl: string
}

interface FullStoryUser {
  id: string
  uid: string
  displayName: string | null
  email: string | null
  accountStatus: string | null
  accountName: string | null
  role: string | null
  appUrl: string | null
  sessions: FullStorySession[]
}

const users = ref<FullStoryUser[]>([])
const total = ref(0)
const isLoading = ref(true)
const error = ref<string | null>(null)
const search = ref('')

const statusColors: Record<string, string> = {
  ACTIVE_TRIAL: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  ACTIVE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  CHURNED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  EXPIRED: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200'
}

const filteredUsers = computed(() => {
  if (!search.value) return users.value
  const q = search.value.toLowerCase()
  return users.value.filter(u =>
    u.email?.toLowerCase().includes(q) ||
    u.displayName?.toLowerCase().includes(q) ||
    u.accountName?.toLowerCase().includes(q)
  )
})

const statusBreakdown = computed(() => {
  const counts: Record<string, number> = {}
  for (const u of users.value) {
    const status = u.accountStatus || 'Unknown'
    counts[status] = (counts[status] || 0) + 1
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])
})

const totalSessions = computed(() => {
  return users.value.reduce((sum, u) => sum + u.sessions.length, 0)
})

async function fetchUsers() {
  isLoading.value = true
  error.value = null
  try {
    const result = await $fetch<any>('/api/fullstory/users')
    users.value = result.users || []
    total.value = result.total || 0
  } catch (err: any) {
    error.value = err.message || 'Failed to load FullStory data'
    toast.add({
      title: 'Error loading analytics',
      description: err.message || 'Failed to fetch FullStory data',
      color: 'error'
    })
  }
  isLoading.value = false
}

function formatStatus(status: string | null): string {
  if (!status) return 'Unknown'
  return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatSessionDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchUsers()
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
            @click="fetchUsers"
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
        <UButton size="sm" @click="fetchUsers">Retry</UButton>
      </div>

      <!-- Results -->
      <div v-else>
        <!-- Stats -->
        <div class="flex items-center gap-3 mb-4">
          <div class="bg-elevated px-4 py-2 rounded-lg">
            <span class="text-xs text-muted uppercase tracking-wide">Pixel AI Users</span>
            <span class="text-lg font-semibold text-highlighted ml-2">{{ total }}</span>
          </div>
          <div class="bg-elevated px-4 py-2 rounded-lg">
            <span class="text-xs text-muted uppercase tracking-wide">Total Sessions</span>
            <span class="text-lg font-semibold text-highlighted ml-2">{{ totalSessions }}</span>
          </div>
          <div
            v-for="[status, count] in statusBreakdown"
            :key="status"
            class="bg-elevated px-4 py-2 rounded-lg"
          >
            <span class="text-xs text-muted uppercase tracking-wide">{{ formatStatus(status) }}</span>
            <span class="text-lg font-semibold text-highlighted ml-2">{{ count }}</span>
          </div>
        </div>

        <!-- Search -->
        <div class="mb-4">
          <UInput
            v-model="search"
            class="max-w-xs"
            size="sm"
            icon="i-lucide-search"
            placeholder="Search users..."
          />
        </div>

        <!-- Users table -->
        <div class="border border-default rounded-lg overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-elevated/50">
                <th class="text-left px-4 py-2.5 font-medium text-muted">User</th>
                <th class="text-left px-4 py-2.5 font-medium text-muted">Account</th>
                <th class="text-left px-4 py-2.5 font-medium text-muted">Status</th>
                <th class="text-left px-4 py-2.5 font-medium text-muted">Sessions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="user in filteredUsers"
                :key="user.id"
                class="border-t border-default hover:bg-elevated/30 align-top"
              >
                <td class="px-4 py-3">
                  <div>
                    <div v-if="user.displayName" class="font-medium">{{ user.displayName }}</div>
                    <div class="text-xs text-muted">{{ user.email || '—' }}</div>
                  </div>
                </td>
                <td class="px-4 py-3 text-muted">
                  {{ user.accountName || '—' }}
                </td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="statusColors[user.accountStatus || ''] || statusColors.EXPIRED"
                  >
                    {{ formatStatus(user.accountStatus) }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div v-if="user.sessions.length > 0" class="flex flex-col gap-1">
                    <a
                      v-for="session in user.sessions"
                      :key="session.sessionId"
                      :href="session.fsUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <UIcon name="i-lucide-play-circle" class="size-3.5 shrink-0" />
                      {{ formatSessionDate(session.createdTime) }}
                    </a>
                  </div>
                  <span v-else class="text-xs text-muted">No sessions</span>
                </td>
              </tr>
              <tr v-if="filteredUsers.length === 0">
                <td colspan="4" class="text-center py-8 text-muted text-sm">
                  No users found
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="text-sm text-muted mt-3">
          {{ filteredUsers.length }} of {{ total }} user(s)
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
