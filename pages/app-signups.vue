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
  linkedin_json: any | null
}

const data = ref<AppSignup[]>([])
const isFetching = ref(true)
const waitlistEmails = ref<Set<string>>(new Set())
const waitlistByEmail = ref<Record<string, any>>({})
const activeEmails = ref<Set<string>>(new Set())
const rawTracesByEmail = ref<Record<string, any[]>>({})
const isLoadingActive = ref(true)

const showDetail = ref(false)
const selectedEmail = ref('')
const selectedName = ref('')
const selectedTraceIndex = ref(0)

const showProfile = ref(false)
const profileData = ref<any>(null)

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
      .select('id, created_at, json_payload, linkedin_json')
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
      return !email || (!suppressedEmails.has(email) && !email.endsWith('@metadata.io'))
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

function getLinkedInPhoto(lj: any): string | null {
  if (!lj) return null
  if (lj.profilePicture) return lj.profilePicture
  if (lj.profilePictures?.length) {
    const preferred = lj.profilePictures.find((p: any) => p.width === 200) || lj.profilePictures[0]
    return preferred?.url || null
  }
  return null
}

function getLinkedInName(lj: any): string | null {
  if (!lj) return null
  return [lj.firstName, lj.lastName].filter(Boolean).join(' ') || null
}

function getPhoto(row: any): string | null {
  return getLinkedInPhoto(row.linkedin_json)
}

function getName(row: any): string | null {
  return getLinkedInName(row.linkedin_json)
}

function getHeadline(row: any): string | null {
  return row.linkedin_json?.headline || null
}

function getTraceInput(trace: any): string {
  if (!trace.input?.messages?.length) return ''
  const human = trace.input.messages.find((m: any) => m.type === 'human')
  return human?.content || ''
}

async function fetchActiveEmails() {
  isLoadingActive.value = true
  try {
    const emails = new Set<string>()
    const byEmail: Record<string, any[]> = {}
    let page = 1
    const size = 200
    let total = 0

    do {
      const result = await $fetch<any>('/api/opik/traces', {
        params: { page, size }
      })
      total = result.total || 0
      for (const trace of (result.content || [])) {
        const email = trace.metadata?.user_email || trace.metadata?.user_meail
        if (email) {
          const key = email.toLowerCase()
          emails.add(key)
          if (!byEmail[key]) byEmail[key] = []
          byEmail[key].push(trace)
        }
      }
      page++
    } while ((page - 1) * size < total)

    activeEmails.value = emails
    for (const key in byEmail) {
      byEmail[key].reverse()
    }
    rawTracesByEmail.value = byEmail
  } catch {
    // Silently fail - not critical
  }
  isLoadingActive.value = false
}

function openUserTraces(email: string, name: string) {
  selectedEmail.value = email.toLowerCase()
  selectedName.value = name
  selectedTraceIndex.value = 0
  showDetail.value = true
}

function openProfile(row: any) {
  profileData.value = row
  showProfile.value = true
}

function getProfilePhoto(lj: any): string | null {
  if (!lj) return null
  if (lj.profilePicture) return lj.profilePicture
  if (lj.profilePictures?.length) {
    const preferred = lj.profilePictures.find((p: any) => p.width === 400)
      || lj.profilePictures[lj.profilePictures.length - 1]
    return preferred?.url || null
  }
  return null
}

function getProfileName(lj: any): string {
  if (!lj) return 'Unknown'
  return [lj.firstName, lj.lastName].filter(Boolean).join(' ') || 'Unknown'
}

function getProfileUrl(lj: any): string | null {
  if (!lj?.username) return null
  return `https://www.linkedin.com/in/${lj.username}`
}

function getCurrentPosition(lj: any) {
  if (!lj?.position?.length) return null
  return lj.position.find((p: any) => !p.end?.year) || lj.position[0]
}

function getTopSkills(lj: any) {
  if (!lj?.skills?.length) return []
  return [...lj.skills]
    .sort((a: any, b: any) => (b.endorsementsCount || 0) - (a.endorsementsCount || 0))
    .slice(0, 12)
}

function formatPositionDate(date: { year?: number; month?: number } | undefined): string {
  if (!date?.year) return 'Present'
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  if (date.month) return `${months[date.month - 1]} ${date.year}`
  return `${date.year}`
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
      <div class="flex items-center gap-3 mb-4">
        <div class="bg-elevated px-4 py-2 rounded-lg">
          <span class="text-xs text-muted uppercase tracking-wide">Signups</span>
          <span class="text-lg font-semibold text-highlighted ml-2">{{ data.length.toLocaleString() }}</span>
        </div>
        <div class="bg-elevated px-4 py-2 rounded-lg">
          <span class="text-xs text-muted uppercase tracking-wide">Active</span>
          <UIcon v-if="isLoadingActive" name="i-lucide-loader-2" class="size-4 animate-spin text-muted ml-2 inline-block align-middle" />
          <template v-else>
            <span class="text-lg font-semibold text-highlighted ml-2">{{ activeCount.toLocaleString() }}</span>
            <span v-if="data.length > 0" class="text-xs text-muted ml-1">({{ Math.round((activeCount / data.length) * 100) }}%)</span>
          </template>
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
          Active <UIcon v-if="isLoadingActive" name="i-lucide-loader-2" class="size-3 animate-spin inline-block align-middle" /><template v-else>({{ activeCount }})</template>
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
          <div class="flex items-start gap-3">
            <!-- Avatar -->
            <img
              v-if="getPhoto(row.original)"
              :src="getPhoto(row.original)!"
              :alt="getName(row.original) || ''"
              class="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5"
            />
            <div v-else class="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-medium text-muted shrink-0 mt-0.5">
              {{ getName(row.original)?.charAt(0)?.toUpperCase() || (row.original.json_payload?.email || '?').charAt(0).toUpperCase() }}
            </div>

            <!-- Info -->
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span v-if="getName(row.original)" class="font-medium truncate">{{ getName(row.original) }}</span>
                <span v-else class="text-sm truncate">{{ row.original.json_payload?.email || '—' }}</span>

                <!-- Tags -->
                <div class="flex items-center gap-1 shrink-0">
                  <span
                    v-if="isOnWaitlist(row.original.json_payload?.email)"
                    class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    Waitlist
                  </span>
                  <span
                    v-if="getWaitlistSource(row.original.json_payload?.email)"
                    class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium text-white"
                    :style="{ backgroundColor: getSourceColor(getWaitlistSource(row.original.json_payload?.email)!) }"
                  >
                    {{ getWaitlistSource(row.original.json_payload?.email) }}
                  </span>
                  <span
                    v-if="activeEmails.has(row.original.json_payload?.email?.toLowerCase())"
                    class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200"
                  >
                    <span class="size-1.5 rounded-full bg-violet-500 animate-pulse" />
                    Active
                  </span>
                </div>
              </div>

              <!-- Email + headline -->
              <div v-if="getName(row.original)" class="text-xs text-muted truncate">
                {{ row.original.json_payload?.email }}
              </div>
              <div
                v-if="getHeadline(row.original)"
                class="text-xs text-muted truncate max-w-[300px]"
                :title="getHeadline(row.original)!"
              >
                {{ getHeadline(row.original) }}
              </div>

              <!-- Action links -->
              <div class="flex items-center gap-3 mt-1">
                <button
                  class="text-xs"
                  :class="row.original.linkedin_json
                    ? 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer'
                    : 'text-muted/50 cursor-default'"
                  :disabled="!row.original.linkedin_json"
                  @click.stop="row.original.linkedin_json && openProfile(row.original)"
                >
                  View Profile
                </button>
                <button
                  class="text-xs"
                  :class="activeEmails.has(row.original.json_payload?.email?.toLowerCase())
                    ? 'text-blue-600 dark:text-blue-400 hover:underline cursor-pointer'
                    : 'text-muted/50 cursor-default'"
                  :disabled="!activeEmails.has(row.original.json_payload?.email?.toLowerCase())"
                  @click.stop="activeEmails.has(row.original.json_payload?.email?.toLowerCase()) && openUserTraces(
                    row.original.json_payload.email,
                    getName(row.original) || ''
                  )"
                >
                  View Conversation
                </button>
              </div>
            </div>
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
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <img
          v-if="getLinkedInPhoto(data.find(d => d.json_payload?.email?.toLowerCase() === selectedEmail)?.linkedin_json)"
          :src="getLinkedInPhoto(data.find(d => d.json_payload?.email?.toLowerCase() === selectedEmail)?.linkedin_json)!"
          :alt="selectedName || selectedEmail"
          class="w-9 h-9 rounded-full object-cover shrink-0"
        />
        <div v-else class="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-medium text-muted shrink-0">
          {{ (selectedName || selectedEmail || '?').charAt(0).toUpperCase() }}
        </div>
        <div class="min-w-0">
          <div class="text-sm font-medium text-highlighted">
            {{ selectedName || selectedEmail }}
          </div>
          <div v-if="selectedName" class="text-xs text-muted">{{ selectedEmail }}</div>
          <div class="text-xs text-muted mt-0.5">
            {{ rawTracesByEmail[selectedEmail]?.length || 0 }} prompt(s)
          </div>
        </div>
      </div>
    </template>

    <template #body>
      <div v-if="rawTracesByEmail[selectedEmail]?.length" class="space-y-4">
        <!-- Prompt selector -->
        <div v-if="rawTracesByEmail[selectedEmail].length > 1" class="flex items-center gap-2 flex-wrap">
          <button
            v-for="(trace, idx) in rawTracesByEmail[selectedEmail]"
            :key="idx"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            :class="selectedTraceIndex === idx
              ? 'bg-primary text-white'
              : 'bg-elevated text-muted hover:text-default'"
            @click="selectedTraceIndex = idx"
          >
            {{ timeAgo(trace.start_time) }}
          </button>
        </div>

        <!-- Prompt input -->
        <div class="rounded-lg border border-default bg-elevated/50 p-4">
          <p class="text-xs font-medium text-muted mb-2">Prompt</p>
          <p class="text-sm text-highlighted leading-relaxed whitespace-pre-wrap">{{ getTraceInput(rawTracesByEmail[selectedEmail][selectedTraceIndex]) || 'No input' }}</p>
        </div>

        <!-- Trace detail component -->
        <TraceDetail
          :trace="rawTracesByEmail[selectedEmail][selectedTraceIndex]"
          :tabs="['creative', 'conversation']"
          default-tab="creative"
        />
      </div>

      <div v-else class="text-sm text-muted text-center py-8">
        No prompts found for this user
      </div>
    </template>
  </USlideover>

  <!-- Profile Slideover -->
  <USlideover v-model:open="showProfile" :ui="{ content: 'max-w-[40rem]' }">
    <template #header>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium text-highlighted">
          {{ getProfileName(profileData?.linkedin_json) }}
        </div>
        <div class="text-xs text-muted">{{ profileData?.json_payload?.email }}</div>
      </div>
    </template>

    <template #body>
      <div v-if="profileData?.linkedin_json" class="space-y-6">
        <!-- Profile Header -->
        <div class="flex gap-4">
          <img
            v-if="getProfilePhoto(profileData.linkedin_json)"
            :src="getProfilePhoto(profileData.linkedin_json)!"
            :alt="getProfileName(profileData.linkedin_json)"
            class="w-20 h-20 rounded-full object-cover shrink-0"
          />
          <div v-else class="w-20 h-20 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xl font-medium text-muted shrink-0">
            {{ getProfileName(profileData.linkedin_json).charAt(0).toUpperCase() }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="text-lg font-semibold">{{ getProfileName(profileData.linkedin_json) }}</h2>
              <span v-if="profileData.linkedin_json.isPremium" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                Premium
              </span>
              <span v-if="profileData.linkedin_json.isCreator" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                Creator
              </span>
            </div>
            <p v-if="profileData.linkedin_json.headline" class="text-sm text-muted mt-1">
              {{ profileData.linkedin_json.headline }}
            </p>
            <p v-if="profileData.linkedin_json.geo?.full" class="text-xs text-muted mt-1">
              {{ profileData.linkedin_json.geo.full }}
            </p>
            <div class="flex items-center gap-4 mt-2">
              <div v-if="getCurrentPosition(profileData.linkedin_json)" class="flex items-center gap-2">
                <img
                  v-if="getCurrentPosition(profileData.linkedin_json).companyLogo"
                  :src="getCurrentPosition(profileData.linkedin_json).companyLogo"
                  :alt="getCurrentPosition(profileData.linkedin_json).companyName"
                  class="w-6 h-6 rounded object-cover"
                />
                <div>
                  <p class="text-xs font-medium">{{ getCurrentPosition(profileData.linkedin_json).title }}</p>
                  <p class="text-xs text-muted">{{ getCurrentPosition(profileData.linkedin_json).companyName }}</p>
                </div>
              </div>
              <a
                v-if="getProfileUrl(profileData.linkedin_json)"
                :href="getProfileUrl(profileData.linkedin_json)!"
                target="_blank"
                rel="noopener noreferrer"
                class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                View LinkedIn
                <UIcon name="i-lucide-external-link" class="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <!-- About -->
        <div v-if="profileData.linkedin_json.summary" class="rounded-lg border border-default p-4">
          <h3 class="text-sm font-semibold mb-2">About</h3>
          <p class="whitespace-pre-wrap text-sm">{{ profileData.linkedin_json.summary }}</p>
        </div>

        <!-- Skills -->
        <div v-if="getTopSkills(profileData.linkedin_json).length" class="rounded-lg border border-default p-4">
          <h3 class="text-sm font-semibold mb-2">Top Skills</h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="skill in getTopSkills(profileData.linkedin_json)"
              :key="skill.name"
              class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-neutral-100 dark:bg-neutral-800"
            >
              {{ skill.name }}
              <span v-if="skill.endorsementsCount" class="text-muted">({{ skill.endorsementsCount }})</span>
            </span>
          </div>
        </div>

        <!-- Experience -->
        <div v-if="profileData.linkedin_json.position?.length" class="rounded-lg border border-default p-4">
          <h3 class="text-sm font-semibold mb-3">Experience</h3>
          <div class="space-y-4">
            <div v-for="(position, index) in profileData.linkedin_json.position" :key="index" class="flex gap-3">
              <img
                v-if="position.companyLogo"
                :src="position.companyLogo"
                :alt="position.companyName"
                class="w-10 h-10 rounded object-cover shrink-0"
              />
              <div v-else class="w-10 h-10 rounded bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-medium text-muted shrink-0">
                {{ position.companyName?.charAt(0) || '?' }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium">{{ position.title }}</p>
                <p class="text-xs text-muted">{{ position.companyName }}</p>
                <p class="text-xs text-muted mt-0.5">
                  {{ formatPositionDate(position.start) }} — {{ formatPositionDate(position.end) }}
                  <span v-if="position.location"> · {{ position.location }}</span>
                </p>
                <p v-if="position.description" class="text-xs mt-1.5 whitespace-pre-wrap">{{ position.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Education -->
        <div v-if="profileData.linkedin_json.educations?.length" class="rounded-lg border border-default p-4">
          <h3 class="text-sm font-semibold mb-3">Education</h3>
          <div class="space-y-4">
            <div v-for="(edu, index) in profileData.linkedin_json.educations" :key="index" class="flex gap-3">
              <img
                v-if="edu.logo?.[0]?.url"
                :src="edu.logo[0].url"
                :alt="edu.schoolName"
                class="w-10 h-10 rounded object-cover shrink-0"
              />
              <div v-else class="w-10 h-10 rounded bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-medium text-muted shrink-0">
                {{ edu.schoolName?.charAt(0) || '?' }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium">{{ edu.schoolName }}</p>
                <p v-if="edu.degree || edu.fieldOfStudy" class="text-xs text-muted">
                  {{ [edu.degree, edu.fieldOfStudy].filter(Boolean).join(' · ') }}
                </p>
                <p v-if="edu.start?.year || edu.end?.year" class="text-xs text-muted mt-0.5">
                  {{ edu.start?.year || '' }}{{ edu.start?.year && edu.end?.year ? ' — ' : '' }}{{ edu.end?.year || '' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Languages -->
        <div v-if="profileData.linkedin_json.languages?.length" class="rounded-lg border border-default p-4">
          <h3 class="text-sm font-semibold mb-2">Languages</h3>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="lang in profileData.linkedin_json.languages"
              :key="lang.name"
              class="inline-flex items-center px-3 py-1 rounded-full text-xs bg-neutral-100 dark:bg-neutral-800"
            >
              {{ lang.name }}
            </span>
          </div>
        </div>
      </div>

      <div v-else class="text-sm text-muted text-center py-8">
        No profile data available
      </div>
    </template>
  </USlideover>
</template>
