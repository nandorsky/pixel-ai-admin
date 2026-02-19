<script setup lang="ts">
interface Trace {
  id: string
  name: string
  start_time: string
  end_time: string | null
  input: any
  output: any
  metadata: Record<string, any> | null
  duration: number | null
  total_estimated_cost: number | null
  usage: Record<string, number> | null
  tags: string[]
  error_info: { exception_type?: string; message?: string } | null
}

const supabase = useSupabase()
const toast = useToast()

const data = ref<Trace[]>([])
const testEmails = ref<Set<string>>(new Set())
const waitlistByEmail = ref<Record<string, any>>({})
const isFetching = ref(true)
const totalTraces = ref(0)
const selectedTrace = ref<Trace | null>(null)
const showDetail = ref(false)

const page = ref(1)
const pageSize = 50

async function fetchTestEmails() {
  const { data: rows } = await supabase
    .from('test_users')
    .select('email')
  testEmails.value = new Set(
    (rows || []).map((r: any) => r.email?.toLowerCase()).filter(Boolean)
  )
}

async function fetchWaitlistUsers() {
  const { data: rows } = await supabase
    .from('signups')
    .select('email, first_name, last_name, linkedin_json')
  const map: Record<string, any> = {}
  for (const r of (rows || [])) {
    if (r.email) map[r.email.toLowerCase()] = r
  }
  waitlistByEmail.value = map
}

function getWaitlistPhoto(email: string | null): string | null {
  if (!email) return null
  const signup = waitlistByEmail.value[email.toLowerCase()]
  if (!signup?.linkedin_json) return null
  const lj = signup.linkedin_json
  if (lj.profilePicture) return lj.profilePicture
  if (lj.profilePictures?.length) {
    const preferred = lj.profilePictures.find((p: any) => p.width === 200) || lj.profilePictures[0]
    return preferred?.url || null
  }
  return null
}

function getWaitlistName(email: string | null): string | null {
  if (!email) return null
  const signup = waitlistByEmail.value[email.toLowerCase()]
  if (!signup) return null
  return [signup.first_name, signup.last_name].filter(Boolean).join(' ') || null
}

async function fetchTraces() {
  isFetching.value = true
  try {
    // Over-fetch to account for test user filtering, then trim to pageSize
    const result = await $fetch<any>('/api/opik/traces', {
      params: { page: page.value, size: pageSize + testEmails.value.size * 5 }
    })
    const allTraces: Trace[] = result.content || []
    data.value = allTraces.filter(t => {
      const email = getUserEmail(t)
      if (!email) return false
      if (testEmails.value.has(email.toLowerCase())) return false
      return true
    }).slice(0, pageSize)
    totalTraces.value = result.total || 0
  } catch (err: any) {
    toast.add({
      title: 'Error fetching traces',
      description: err.data?.message || err.message || 'Unknown error',
      color: 'error'
    })
  }
  isFetching.value = false
}

onMounted(async () => {
  await Promise.all([fetchTestEmails(), fetchWaitlistUsers()])
  fetchTraces()
})

watch(page, () => {
  fetchTraces()
})

function openDetail(trace: Trace) {
  selectedTrace.value = trace
  showDetail.value = true
}

function getUserEmail(trace: Trace): string | null {
  return trace.metadata?.user_email || trace.metadata?.user_meail || null
}

function getInputText(trace: Trace): string {
  if (!trace.input?.messages?.length) return ''
  const human = trace.input.messages.find((m: any) => m.type === 'human')
  return human?.content || ''
}

function getImageUrls(trace: Trace): string[] {
  if (!trace.output?.messages?.length) return []
  const urls: string[] = []
  const pngRegex = /https?:\/\/[^\s"']+\.png/gi

  for (const msg of trace.output.messages) {
    const content = msg.content || ''
    const text = typeof content === 'string' ? content : JSON.stringify(content)
    const matches = text.match(pngRegex)
    if (matches) {
      for (const url of matches) {
        if (!urls.includes(url)) urls.push(url)
      }
    }
  }

  return urls
}

function formatDuration(ms: number | null): string {
  if (ms === null || ms === undefined) return '—'
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
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
  return formatDate(dateString)
}

function getEmailInitial(email: string): string {
  return email.charAt(0).toUpperCase()
}

const totalPages = computed(() => Math.ceil(totalTraces.value / pageSize))
</script>

<template>
  <UDashboardPanel id="traces">
    <template #header>
      <UDashboardNavbar title="Prompts">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading -->
      <div v-if="isFetching && !data.length" class="flex items-center justify-center py-16">
        <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin text-muted" />
      </div>

      <!-- Empty -->
      <div v-else-if="!data.length" class="text-center py-16 text-muted text-sm">
        No traces found
      </div>

      <!-- Feed -->
      <div v-else class="max-w-2xl mx-auto space-y-0">
        <div
          v-for="(trace, idx) in data"
          :key="trace.id"
          class="relative flex gap-4 pb-6 cursor-pointer group"
          @click="openDetail(trace)"
        >
          <!-- Timeline line -->
          <div class="flex flex-col items-center">
            <img
              v-if="getWaitlistPhoto(getUserEmail(trace))"
              :src="getWaitlistPhoto(getUserEmail(trace))!"
              :alt="getWaitlistName(getUserEmail(trace)) || ''"
              class="size-9 rounded-full object-cover shrink-0 ring-2 ring-offset-2 ring-offset-[var(--ui-bg)] ring-primary/30"
            />
            <div
              v-else
              class="size-9 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ring-2 ring-offset-2 ring-offset-[var(--ui-bg)] transition-shadow"
              :class="getUserEmail(trace)
                ? 'bg-primary/10 text-primary ring-primary/30'
                : 'bg-neutral-100 dark:bg-neutral-800 text-muted ring-neutral-200 dark:ring-neutral-700'"
            >
              {{ getUserEmail(trace) ? getEmailInitial(getUserEmail(trace)!) : '?' }}
            </div>
            <div
              v-if="idx < data.length - 1"
              class="w-px flex-1 bg-default mt-2"
            />
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0 pt-0.5 pb-2">
            <!-- Header: email + timestamp -->
            <div class="flex items-center gap-2 mb-1.5">
              <span class="text-sm font-medium text-highlighted truncate">
                {{ getWaitlistName(getUserEmail(trace)) || getUserEmail(trace) || 'Unknown user' }}
              </span>
              <span v-if="getWaitlistName(getUserEmail(trace)) && getUserEmail(trace)" class="text-xs text-muted truncate hidden sm:inline">
                {{ getUserEmail(trace) }}
              </span>
              <span
                v-if="trace.error_info"
                class="size-2 rounded-full bg-red-500 shrink-0"
              />
              <span class="text-xs text-muted shrink-0 ml-auto">
                {{ timeAgo(trace.start_time) }}
              </span>
            </div>

            <!-- Input message -->
            <p class="text-sm text-default leading-relaxed line-clamp-3">
              {{ getInputText(trace) || trace.name || 'No input' }}
            </p>

            <!-- Meta chips -->
            <div class="flex items-center gap-3 mt-2 text-xs text-muted">
              <span v-if="trace.duration" class="flex items-center gap-1">
                <UIcon name="i-lucide-clock" class="size-3" />
                {{ formatDuration(trace.duration) }}
              </span>
              <span v-if="trace.usage?.completion_tokens" class="flex items-center gap-1">
                <UIcon name="i-lucide-hash" class="size-3" />
                {{ (trace.usage.prompt_tokens + trace.usage.completion_tokens).toLocaleString() }} tokens
              </span>
              <span v-if="trace.total_estimated_cost" class="flex items-center gap-1">
                <UIcon name="i-lucide-dollar-sign" class="size-3" />
                {{ trace.total_estimated_cost.toFixed(4) }}
              </span>
              <span v-if="getImageUrls(trace).length" class="inline-flex items-center gap-1 text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                <UIcon name="i-lucide-image" class="size-3" />
                {{ getImageUrls(trace).length }} image{{ getImageUrls(trace).length > 1 ? 's' : '' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto max-w-2xl mx-auto w-full">
        <div class="text-sm text-muted">
          {{ totalTraces.toLocaleString() }} trace(s)
        </div>
        <div class="flex items-center gap-1.5">
          <UButton
            icon="i-lucide-chevron-left"
            color="neutral"
            variant="outline"
            size="sm"
            :disabled="page <= 1"
            @click="page--"
          />
          <span class="text-sm text-muted px-2">{{ page }} / {{ totalPages }}</span>
          <UButton
            icon="i-lucide-chevron-right"
            color="neutral"
            variant="outline"
            size="sm"
            :disabled="page >= totalPages"
            @click="page++"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Detail Slideover -->
  <USlideover v-model:open="showDetail" :ui="{ content: 'max-w-[56rem]' }">
    <template #header>
      <div v-if="selectedTrace" class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span
            class="size-2.5 rounded-full shrink-0"
            :class="selectedTrace.error_info ? 'bg-red-500' : 'bg-green-500'"
          />
          <span class="text-sm font-medium text-highlighted truncate">
            {{ selectedTrace.name || 'Unnamed trace' }}
          </span>
        </div>
        <div class="flex items-center gap-4 text-xs text-muted">
          <span v-if="getUserEmail(selectedTrace)">{{ getUserEmail(selectedTrace) }}</span>
          <span>{{ formatDate(selectedTrace.start_time) }}</span>
          <span>{{ formatDuration(selectedTrace.duration) }}</span>
          <span v-if="selectedTrace.total_estimated_cost != null">${{ selectedTrace.total_estimated_cost.toFixed(4) }}</span>
        </div>
      </div>
    </template>

    <template #body>
      <div v-if="selectedTrace" class="space-y-4">
        <!-- Stats row -->
        <div class="flex flex-wrap gap-3">
          <div v-if="selectedTrace.usage?.prompt_tokens" class="px-3 py-2 bg-elevated rounded-lg">
            <p class="text-xs text-muted">Prompt</p>
            <p class="text-sm font-medium">{{ selectedTrace.usage.prompt_tokens.toLocaleString() }}</p>
          </div>
          <div v-if="selectedTrace.usage?.completion_tokens" class="px-3 py-2 bg-elevated rounded-lg">
            <p class="text-xs text-muted">Completion</p>
            <p class="text-sm font-medium">{{ selectedTrace.usage.completion_tokens.toLocaleString() }}</p>
          </div>
          <div v-if="selectedTrace.metadata?.tool_count" class="px-3 py-2 bg-elevated rounded-lg">
            <p class="text-xs text-muted">Tools</p>
            <p class="text-sm font-medium">{{ selectedTrace.metadata.tool_count }}</p>
          </div>
          <div v-if="selectedTrace.metadata?.account_id" class="px-3 py-2 bg-elevated rounded-lg">
            <p class="text-xs text-muted">Account</p>
            <p class="text-sm font-medium">{{ selectedTrace.metadata.account_id }}</p>
          </div>
        </div>

        <TraceDetail :trace="selectedTrace" />

        <!-- Error info -->
        <div v-if="selectedTrace.error_info" class="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
          <p class="text-sm font-medium text-red-700 dark:text-red-300">{{ selectedTrace.error_info.exception_type || 'Error' }}</p>
          <p class="text-xs text-red-600 dark:text-red-400 mt-1">{{ selectedTrace.error_info.message }}</p>
        </div>

        <!-- Trace ID -->
        <p class="text-xs text-muted font-mono">{{ selectedTrace.id }}</p>
      </div>
    </template>
  </USlideover>
</template>
