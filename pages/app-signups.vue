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

const data = ref<AppSignup[]>([])
const isFetching = ref(true)
const waitlistEmails = ref<Set<string>>(new Set())
const waitlistByEmail = ref<Record<string, any>>({})

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

  const [signupsResult, waitlistResult] = await Promise.all([
    supabase
      .from('app_signups')
      .select('id, created_at, json_payload')
      .order('created_at', { ascending: false }),
    supabase
      .from('signups')
      .select('id, email, first_name, last_name, utm_parameters, referred_by, linkedin_json')
  ])

  if (signupsResult.error) {
    toast.add({
      title: 'Error fetching signups',
      description: signupsResult.error.message,
      color: 'error'
    })
  } else {
    data.value = signupsResult.data || []
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

onMounted(() => {
  fetchAppSignups()
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
      <div class="flex flex-wrap items-center justify-between gap-1.5 mb-4">
        <UInput
          v-model="searchFilter"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search by email..."
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
        :data="data"
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
                <NuxtLink
                  :to="`/signups/${waitlistByEmail[row.original.json_payload.email.toLowerCase()].id}`"
                  class="font-medium text-blue-600 dark:text-blue-400 hover:underline truncate block"
                >
                  {{ waitlistByEmail[row.original.json_payload.email.toLowerCase()].first_name || '' }}
                  {{ waitlistByEmail[row.original.json_payload.email.toLowerCase()].last_name || '' }}
                </NuxtLink>
                <div class="text-xs text-muted truncate">{{ row.original.json_payload.email }}</div>
              </template>
              <span v-else class="text-sm">{{ row.original.json_payload?.email || '—' }}</span>
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
          {{ data.length }} signup(s) total
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
</template>
