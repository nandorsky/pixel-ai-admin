<script setup lang="ts">
const toast = useToast()

interface FullStorySession {
  sessionId: string
  createdTime: number
  fsUrl: string
}

interface FullStoryUser {
  email: string
  displayName: string | null
  sessions: FullStorySession[]
}

const users = ref<FullStoryUser[]>([])
const total = ref(0)
const isLoading = ref(true)
const error = ref<string | null>(null)
const search = ref('')

const filteredUsers = computed(() => {
  if (!search.value) return users.value
  const q = search.value.toLowerCase()
  return users.value.filter(u =>
    u.email?.toLowerCase().includes(q) ||
    u.displayName?.toLowerCase().includes(q)
  )
})

const totalSessions = computed(() => {
  return users.value.reduce((sum, u) => sum + u.sessions.length, 0)
})

const withSessions = computed(() => {
  return users.value.filter(u => u.sessions.length > 0).length
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
        <p class="text-sm text-muted">Loading FullStory data...</p>
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
            <span class="text-xs text-muted uppercase tracking-wide">App Signups</span>
            <span class="text-lg font-semibold text-highlighted ml-2">{{ total }}</span>
          </div>
          <div class="bg-elevated px-4 py-2 rounded-lg">
            <span class="text-xs text-muted uppercase tracking-wide">With Sessions</span>
            <span class="text-lg font-semibold text-highlighted ml-2">{{ withSessions }}</span>
          </div>
          <div class="bg-elevated px-4 py-2 rounded-lg">
            <span class="text-xs text-muted uppercase tracking-wide">Total Sessions</span>
            <span class="text-lg font-semibold text-highlighted ml-2">{{ totalSessions }}</span>
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
                <th class="text-left px-4 py-2.5 font-medium text-muted">Sessions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="user in filteredUsers"
                :key="user.email"
                class="border-t border-default hover:bg-elevated/30 align-top"
              >
                <td class="px-4 py-3">
                  <div>
                    <div v-if="user.displayName" class="font-medium">{{ user.displayName }}</div>
                    <div class="text-xs text-muted">{{ user.email }}</div>
                  </div>
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
                <td colspan="2" class="text-center py-8 text-muted text-sm">
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
