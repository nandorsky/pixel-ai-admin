<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'
import { getSignupSource, getSourceColor } from '~/utils/signup-source'

const supabase = useSupabase()
const toast = useToast()
const table = useTemplateRef('table')

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
}

interface TraceEntry {
  input: string
  images: string[]
  date: string
}

const data = ref<AppSignup[]>([])
const isFetching = ref(true)
const waitlistEmails = ref<Set<string>>(new Set())
const waitlistByEmail = ref<Record<string, any>>({})
const activeEmails = ref<Set<string>>(new Set())
const tracesByEmail = ref<Record<string, TraceEntry[]>>({})

const showDetail = ref(false)
const selectedEmail = ref('')
const selectedName = ref('')

const viewTab = ref('all')

const columnFilters = ref([{
  id: 'email',
  value: ''
}])

const pagination = ref({
  pageIndex: 0,
  pageSize: 50
})

async function fetchAppSignups() {
  isFetching.value = true

  const [signupsResult, waitlistResult, testUsersResult] = await Promise.all([
    supabase
      .from('app_signups')
      .select('id, created_at, json_payload')
      .order('created_at', { ascending: false }),
    supabase
      .from('signups')
      .select('id, email, first_name, last_name, utm_parameters, referred_by, linkedin_json'),
    supabase
      .from('test_users')
      .select('email')
  ])

  const suppressedEmails = new Set(
    (testUsersResult.data || []).map((r: any) => r.email?.toLowerCase()).filter(Boolean)
  )

  if (signupsResult.error) {
    toast.add({
      title: 'Error fetching signups',
      description: signupsResult.error.message,
      color: 'error'
    })
  } else {
    data.value = (signupsResult.data || []).filter(s => {
      const email = s.json_payload?.email?.toLowerCase()
      return !email || !suppressedEmails.has(email)
    })
  }

  if (waitlistResult.data) {
    waitlistEmails.value = new Set(
      waitlistResult.data.map((r: any) => r.email?.toLowerCase())
    )
    const map: Record<string, any> = {}
    for (const r of waitlistResult.data) {
      if (r.email) map[r.email.toLowerCase()] = r
    }
    waitlistByEmail.value = map
  }

  isFetching.value = false
}

function isOnWaitlist(email: string): boolean {
  return waitlistEmails.value.has(email?.toLowerCase())
}

function getWaitlistSource(email: string): string | null {
  const signup = waitlistByEmail.value[email?.toLowerCase()]
  if (!signup) return null
  return getSignupSource(signup)
}

function getWaitlistPhoto(email: string): string | null {
  const signup = waitlistByEmail.value[email?.toLowerCase()]
  if (!signup?.linkedin_json) return null
  const lj = signup.linkedin_json
  if (lj.profilePicture) return lj.profilePicture
  if (lj.profilePictures?.length) {
    const preferred = lj.profilePictures.find((p: any) => p.width === 200) || lj.profilePictures[0]
    return preferred?.url || null
  }
  return null
}

function getTraceInput(trace: any): string {
  if (!trace.input?.messages?.length) return ''
  const human = trace.input.messages.find((m: any) => m.type === 'human')
  return human?.content || ''
}

function getTraceImages(trace: any): string[] {
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

async function fetchActiveEmails() {
  try {
    const result = await $fetch<any>('/api/opik/traces', {
      params: { page: 1, size: 200 }
    })
    const emails = new Set<string>()
    const byEmail: Record<string, TraceEntry[]> = {}
    for (const trace of (result.content || [])) {
      const email = trace.metadata?.user_email || trace.metadata?.user_meail
      if (email) {
        const key = email.toLowerCase()
        emails.add(key)
        if (!byEmail[key]) byEmail[key] = []
        byEmail[key].push({
          input: getTraceInput(trace),
          images: getTraceImages(trace),
          date: trace.start_time
        })
      }
    }
    activeEmails.value = emails
    for (const key in byEmail) {
      byEmail[key].reverse()
    }
    tracesByEmail.value = byEmail
  } catch {
    // Silently fail - not critical
  }
}

function openUserTraces(email: string, name: string) {
  selectedEmail.value = email.toLowerCase()
  selectedName.value = name
  showDetail.value = true
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

const activeCount = computed(() => {
  return data.value.filter(s => activeEmails.value.has(s.json_payload?.email?.toLowerCase())).length
})

const filteredData = computed(() => {
  if (viewTab.value === 'active') {
    return data.value.filter(s => activeEmails.value.has(s.json_payload?.email?.toLowerCase()))
  }
  return data.value
})

onMounted(() => {
  fetchAppSignups()
  fetchActiveEmails()
})

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const columns: TableColumn<AppSignup>[] = [
  {
    id: 'email',
    header: 'Email',
    accessorFn: (row) => row.json_payload?.email || '',
    size: 250
  },
  {
    accessorKey: 'created_at',
    header: 'Signed Up'
  }
]

const searchFilter = computed({
  get: (): string => {
    return (table.value?.tableApi?.getColumn('email')?.getFilterValue() as string) || ''
  },
  set: (value: string) => {
    table.value?.tableApi?.getColumn('email')?.setFilterValue(value || undefined)
  }
})
</script>

<template>
  <UDashboardPanel id="app-signups">
    <template #header>
      <UDashboardNavbar title="Signups">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="grid grid-cols-2 gap-px bg-default/50 rounded-lg mb-6 max-w-sm">
        <div class="bg-elevated p-6">
          <p class="text-xs text-muted uppercase tracking-wide">Signups</p>
          <p class="text-3xl font-semibold text-highlighted mt-1">{{ data.length.toLocaleString() }}</p>
        </div>
        <div class="bg-elevated p-6">
          <p class="text-xs text-muted uppercase tracking-wide">Active</p>
          <p class="text-3xl font-semibold text-highlighted mt-1">{{ activeCount.toLocaleString() }}<span v-if="data.length" class="text-lg text-muted font-normal"> / {{ data.length.toLocaleString() }}</span></p>
          <p v-if="data.length > 0" class="text-xs text-muted mt-1">{{ Math.round((activeCount / data.length) * 100) }}% activation</p>
        </div>
      </div>

      <div class="flex items-center gap-4 border-b border-default mb-4">
        <button
          class="pb-2 text-sm font-medium border-b-2 transition-colors"
          :class="viewTab === 'all' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-default'"
          @click="viewTab = 'all'"
        >
          All ({{ data.length }})
        </button>
        <button
          class="pb-2 text-sm font-medium border-b-2 transition-colors"
          :class="viewTab === 'active' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-default'"
          @click="viewTab = 'active'"
        >
          Active ({{ activeCount }})
        </button>
        <UInput
          v-model="searchFilter"
          class="max-w-48 ml-auto"
          size="sm"
          icon="i-lucide-search"
          placeholder="Search..."
        />
      </div>

      <UTable
        ref="table"
        v-model:column-filters="columnFilters"
        v-model:pagination="pagination"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel()
        }"
        class="shrink-0"
        :data="filteredData"
        :columns="columns"
        :loading="isFetching"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          separator: 'h-0'
        }"
      >
        <template #email-cell="{ row }">
          <div class="flex items-center gap-2">
            <template v-if="waitlistByEmail[row.original.json_payload?.email?.toLowerCase()]">
              <img
                v-if="getWaitlistPhoto(row.original.json_payload.email)"
                :src="getWaitlistPhoto(row.original.json_payload.email)!"
                :alt="waitlistByEmail[row.original.json_payload.email.toLowerCase()].first_name || ''"
                class="w-8 h-8 rounded-full object-cover shrink-0"
              />
              <div v-else class="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-medium text-muted shrink-0">
                {{ [waitlistByEmail[row.original.json_payload.email.toLowerCase()].first_name, waitlistByEmail[row.original.json_payload.email.toLowerCase()].last_name].filter(Boolean).map((n: string) => n.charAt(0)).join('').toUpperCase() || row.original.json_payload.email.charAt(0).toUpperCase() }}
              </div>
            </template>
            <div v-else class="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-medium text-muted shrink-0">
              {{ (row.original.json_payload?.email || '?').charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0">
              <template v-if="waitlistByEmail[row.original.json_payload?.email?.toLowerCase()]">
                <button
                  v-if="activeEmails.has(row.original.json_payload.email.toLowerCase())"
                  class="font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block text-left"
                  @click.stop="openUserTraces(
                    row.original.json_payload.email,
                    `${waitlistByEmail[row.original.json_payload.email.toLowerCase()].first_name || ''} ${waitlistByEmail[row.original.json_payload.email.toLowerCase()].last_name || ''}`.trim()
                  )"
                >
                  {{ waitlistByEmail[row.original.json_payload.email.toLowerCase()].first_name || '' }}
                  {{ waitlistByEmail[row.original.json_payload.email.toLowerCase()].last_name || '' }}
                </button>
                <NuxtLink
                  v-else
                  :to="`/signups/${waitlistByEmail[row.original.json_payload.email.toLowerCase()].id}`"
                  class="font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block"
                >
                  {{ waitlistByEmail[row.original.json_payload.email.toLowerCase()].first_name || '' }}
                  {{ waitlistByEmail[row.original.json_payload.email.toLowerCase()].last_name || '' }}
                </NuxtLink>
                <div class="text-xs text-muted truncate">{{ row.original.json_payload.email }}</div>
              </template>
              <template v-else>
                <button
                  v-if="activeEmails.has(row.original.json_payload?.email?.toLowerCase())"
                  class="text-sm text-blue-600 dark:text-blue-400 hover:underline text-left"
                  @click.stop="openUserTraces(row.original.json_payload.email, '')"
                >
                  {{ row.original.json_payload?.email || '—' }}
                </button>
                <span v-else class="text-sm">{{ row.original.json_payload?.email || '—' }}</span>
              </template>
            </div>
            <span
              v-if="isOnWaitlist(row.original.json_payload?.email)"
              class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 shrink-0"
            >
              Waitlist
            </span>
            <span
              v-if="getWaitlistSource(row.original.json_payload?.email)"
              class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-white shrink-0"
              :style="{ backgroundColor: getSourceColor(getWaitlistSource(row.original.json_payload?.email)!) }"
            >
              {{ getWaitlistSource(row.original.json_payload?.email) }}
            </span>
            <span
              v-if="activeEmails.has(row.original.json_payload?.email?.toLowerCase())"
              class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200 shrink-0"
            >
              <span class="size-1.5 rounded-full bg-violet-500 animate-pulse" />
              Active
            </span>
          </div>
        </template>


        <template #created_at-cell="{ row }">
          {{ formatDate(row.original.created_at) }}
        </template>

        <template #empty>
          <div v-if="isFetching" class="flex items-center justify-center py-8">
            <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin text-muted" />
          </div>
          <div v-else class="text-center py-8 text-muted text-sm">
            No signups found
          </div>
        </template>
      </UTable>

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          {{ filteredData.length }} signup(s){{ viewTab !== 'all' ? ' matching' : ' total' }}
        </div>

        <div class="flex items-center gap-1.5">
          <UPagination
            :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
            :items-per-page="table?.tableApi?.getState().pagination.pageSize"
            :total="table?.tableApi?.getFilteredRowModel().rows.length"
            @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>

  <!-- User Prompts Slideover -->
  <USlideover v-model:open="showDetail" :ui="{ content: 'max-w-[56rem]' }">
    <template #header>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium text-highlighted">
          {{ selectedName || selectedEmail }}
        </div>
        <div v-if="selectedName" class="text-xs text-muted">{{ selectedEmail }}</div>
        <div class="text-xs text-muted mt-0.5">
          {{ tracesByEmail[selectedEmail]?.length || 0 }} prompt(s)
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <div
          v-for="(trace, idx) in tracesByEmail[selectedEmail] || []"
          :key="idx"
          class="rounded-lg border border-default bg-elevated/50 overflow-hidden"
        >
          <!-- Prompt -->
          <div class="px-4 py-3 border-b border-default">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs text-muted">{{ timeAgo(trace.date) }}</span>
              <span v-if="trace.images.length" class="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                <UIcon name="i-lucide-image" class="size-3" />
                {{ trace.images.length }}
              </span>
            </div>
            <p class="text-sm text-highlighted leading-relaxed whitespace-pre-wrap">{{ trace.input || 'No input' }}</p>
          </div>

          <!-- Images -->
          <div v-if="trace.images.length" class="grid grid-cols-4 gap-2 p-3">
            <a
              v-for="(url, imgIdx) in trace.images"
              :key="imgIdx"
              :href="url"
              target="_blank"
              class="block rounded-lg border border-default overflow-hidden hover:ring-2 hover:ring-primary/50 transition-shadow"
            >
              <img
                :src="url"
                :alt="`Creative ${imgIdx + 1}`"
                class="w-full h-auto object-contain bg-neutral-50 dark:bg-neutral-900"
              />
            </a>
          </div>
        </div>

        <div v-if="!tracesByEmail[selectedEmail]?.length" class="text-sm text-muted text-center py-8">
          No prompts found for this user
        </div>
      </div>
    </template>
  </USlideover>
</template>
