<script setup lang="ts">
import { upperFirst } from 'scule'
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'
import { getSignupSource, getSourceColor } from '~/utils/signup-source'

const supabase = useSupabase()

interface LinkedInProfilePicture {
  url: string
  width: number
  height: number
}

interface LinkedInJson {
  headline?: string
  profilePicture?: string
  profilePictures?: LinkedInProfilePicture[]
  firstName?: string
  lastName?: string
}

function getLinkedInPhoto(linkedin: LinkedInJson | null): string | null {
  if (!linkedin) return null
  if (linkedin.profilePicture) return linkedin.profilePicture
  if (linkedin.profilePictures?.length) {
    // Prefer 200x200 size, fallback to first available
    const preferred = linkedin.profilePictures.find(p => p.width === 200) || linkedin.profilePictures[0]
    return preferred?.url || null
  }
  return null
}

interface Signup {
  id: string
  created_at: string
  email: string
  first_name: string | null
  last_name: string | null
  referral_code: string
  utm_parameters: Record<string, string> | null
  linkedin_json: LinkedInJson | null
}

const toast = useToast()
const table = useTemplateRef('table')

const columnFilters = ref([{
  id: 'email',
  value: ''
}])
const columnVisibility = ref({
  source: true
})
const rowSelection = ref({})

const data = ref<Signup[]>([])
const isFetching = ref(true)

async function fetchSignups() {
  isFetching.value = true
  const { data: signups, error } = await supabase
    .from('signups')
    .select('id, created_at, email, first_name, last_name, referral_code, utm_parameters, linkedin_json')
    .order('created_at', { ascending: false })

  if (error) {
    toast.add({
      title: 'Error fetching signups',
      description: error.message,
      color: 'error'
    })
  } else {
    data.value = signups || []
  }
  isFetching.value = false
}

onMounted(() => {
  fetchSignups()
})

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text)
  toast.add({
    title: 'Copied to clipboard',
    description: `${label} copied to clipboard`
  })
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function truncateId(id: string | number) {
  const str = String(id)
  return str.length > 8 ? str.substring(0, 8) + '...' : str
}

const columns: TableColumn<Signup>[] = [
  {
    accessorKey: 'id',
    header: 'ID'
  },
  {
    id: 'name',
    header: 'Name',
    accessorFn: (row) => `${row.first_name || ''} ${row.last_name || ''}`.trim()
  },
  {
    accessorKey: 'email',
    header: 'Email'
  },
  {
    id: 'source',
    header: 'Source',
    accessorFn: (row) => getSignupSource(row)
  },
  {
    accessorKey: 'created_at',
    header: 'Signed Up'
  },
  {
    accessorKey: 'referral_code',
    header: 'Referral Code'
  },
  {
    id: 'referral_link',
    header: 'Referral Link',
    accessorFn: (row) => `https://getpixel.ai?ref=${row.referral_code}`
  }
]

const email = computed({
  get: (): string => {
    return (table.value?.tableApi?.getColumn('email')?.getFilterValue() as string) || ''
  },
  set: (value: string) => {
    table.value?.tableApi?.getColumn('email')?.setFilterValue(value || undefined)
  }
})

const pagination = ref({
  pageIndex: 0,
  pageSize: 50
})
</script>

<template>
  <UDashboardPanel id="signups">
    <template #header>
      <UDashboardNavbar title="Signups">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="email"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search..."
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <UDropdownMenu
            :items="
              table?.tableApi
                ?.getAllColumns()
                .filter((column: any) => column.getCanHide())
                .map((column: any) => ({
                  label: upperFirst(column.id),
                  type: 'checkbox' as const,
                  checked: column.getIsVisible(),
                  onUpdateChecked(checked: boolean) {
                    table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
                  },
                  onSelect(e?: Event) {
                    e?.preventDefault()
                  }
                }))
            "
            :content="{ align: 'end' }"
          >
            <UButton
              label="Display"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-settings-2"
            />
          </UDropdownMenu>
        </div>
      </div>

      <UTable
        ref="table"
        v-model:column-filters="columnFilters"
        v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection"
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
        <template #id-cell="{ row }">
          <span class="font-mono text-xs">{{ truncateId(row.original.id) }}</span>
        </template>

        <template #name-cell="{ row }">
          <NuxtLink
            :to="`/signups/${row.original.id}`"
            class="flex items-center gap-3 hover:opacity-80"
          >
            <img
              v-if="getLinkedInPhoto(row.original.linkedin_json)"
              :src="getLinkedInPhoto(row.original.linkedin_json)!"
              :alt="`${row.original.first_name || ''} ${row.original.last_name || ''}`"
              class="w-10 h-10 rounded-full object-cover shrink-0"
            />
            <div class="min-w-0">
              <div class="font-medium text-blue-600 dark:text-blue-400 hover:underline truncate">
                {{ row.original.first_name || '' }} {{ row.original.last_name || '' }}
              </div>
              <div
                v-if="row.original.linkedin_json?.headline"
                class="text-xs text-muted truncate max-w-[250px]"
                :title="row.original.linkedin_json.headline"
              >
                {{ row.original.linkedin_json.headline }}
              </div>
            </div>
          </NuxtLink>
        </template>

        <template #email-cell="{ row }">
          {{ row.original.email }}
        </template>

        <template #referral_code-cell="{ row }">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs">{{ row.original.referral_code }}</span>
            <UButton
              icon="i-lucide-copy"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="copyToClipboard(row.original.referral_code, 'Referral code')"
            />
          </div>
        </template>

        <template #source-cell="{ row }">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
            :style="{ backgroundColor: getSourceColor(getSignupSource(row.original)) }"
          >
            {{ getSignupSource(row.original) }}
          </span>
        </template>

        <template #created_at-cell="{ row }">
          {{ formatDate(row.original.created_at) }}
        </template>

        <template #referral_link-cell="{ row }">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs truncate max-w-[200px]">https://getpixel.ai?ref={{ row.original.referral_code }}</span>
            <UButton
              icon="i-lucide-copy"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="copyToClipboard(`https://getpixel.ai?ref=${row.original.referral_code}`, 'Referral link')"
            />
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
