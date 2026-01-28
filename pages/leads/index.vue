<script setup lang="ts">
import { upperFirst } from 'scule'
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'

const supabase = useSupabase()

interface BetterEnrichResponse {
  id: string
  data?: {
    email?: string
    ESP?: string
    status?: string
    verifier?: string
  }
  status: string
}

interface Lead {
  id: number
  created_at: string
  fullName: string
  firstName: string
  linkedinUrl: string
  qualified: boolean | string
  custom_prompt: string
  linkedinTitle: string
  type: string
  profileImg: string | null
  betterenrich_response: BetterEnrichResponse | null
}

const toast = useToast()
const table = useTemplateRef('table')

const columnFilters = ref([{
  id: 'fullName',
  value: ''
}])
const columnVisibility = ref({})
const rowSelection = ref({})

const data = ref<Lead[]>([])
const isFetching = ref(true)
const stats = ref({ total: 0, qualified: 0, unqualified: 0 })
const searchQuery = ref('')

async function fetchLeads(search?: string) {
  isFetching.value = true

  // Fetch leads for table
  let query = supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  // Add search filter if provided
  if (search && search.trim()) {
    query = query.ilike('fullName', `%${search.trim()}%`)
  }

  const { data: leads, error } = await query

  if (error) {
    toast.add({
      title: 'Error fetching leads',
      description: error.message,
      color: 'error'
    })
  } else {
    data.value = leads || []
  }

  // Fetch counts separately
  const [totalResult, qualifiedResult, unqualifiedResult] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('qualified', true),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('qualified', false)
  ])

  stats.value = {
    total: totalResult.count ?? 0,
    qualified: qualifiedResult.count ?? 0,
    unqualified: unqualifiedResult.count ?? 0
  }

  isFetching.value = false
}

onMounted(() => {
  fetchLeads()
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

const columns: TableColumn<Lead>[] = [
  {
    accessorKey: 'id',
    header: 'ID'
  },
  {
    accessorKey: 'fullName',
    header: 'Name'
  },
  {
    id: 'email',
    header: 'Email',
    accessorFn: (row) => row.betterenrich_response?.data?.email || null
  },
  {
    accessorKey: 'linkedinTitle',
    header: 'Title'
  },
  {
    accessorKey: 'type',
    header: 'Type'
  },
  {
    accessorKey: 'qualified',
    header: 'Qualified'
  },
  {
    accessorKey: 'custom_prompt',
    header: 'Email Copy'
  }
]

const pagination = ref({
  pageIndex: 0,
  pageSize: 50
})

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null
function onSearch(value: string) {
  searchQuery.value = value
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchLeads(value)
  }, 300)
}

</script>

<template>
  <UDashboardPanel id="leads">
    <template #header>
      <UDashboardNavbar title="Leads">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Stats Row -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px;" class="bg-default/50 rounded-lg mb-8">
        <div class="bg-elevated p-6">
          <p class="text-xs text-muted uppercase tracking-wide">Total Leads</p>
          <p class="text-3xl font-semibold text-highlighted mt-1">{{ stats.total.toLocaleString() }}</p>
        </div>
        <div class="bg-elevated p-6">
          <p class="text-xs text-muted uppercase tracking-wide">Qualified</p>
          <p class="text-3xl font-semibold text-highlighted mt-1">{{ stats.qualified.toLocaleString() }}</p>
        </div>
        <div class="bg-elevated p-6">
          <p class="text-xs text-muted uppercase tracking-wide">Unqualified</p>
          <p class="text-3xl font-semibold text-highlighted mt-1">{{ stats.unqualified.toLocaleString() }}</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          :model-value="searchQuery"
          @update:model-value="onSearch"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search by name..."
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
          base: 'border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          separator: 'h-0'
        }"
      >
        <template #id-cell="{ row }">
          <span class="font-mono text-xs">{{ row.original.id }}</span>
        </template>

        <template #fullName-cell="{ row }">
          <div class="flex items-center gap-3">
            <img
              v-if="row.original.profileImg"
              :src="row.original.profileImg"
              :alt="row.original.fullName"
              class="w-8 h-8 rounded-full object-cover shrink-0"
            />
            <NuxtLink
              :to="`/leads/${row.original.id}`"
              class="font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              {{ row.original.fullName }}
            </NuxtLink>
            <a
              v-if="row.original.linkedinUrl"
              :href="row.original.linkedinUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              @click.stop
            >
              <UIcon name="i-lucide-external-link" class="w-4 h-4" />
            </a>
          </div>
        </template>

        <template #email-cell="{ row }">
          <div v-if="row.original.betterenrich_response?.data?.email" class="flex items-center gap-2">
            <span class="text-sm">{{ row.original.betterenrich_response.data.email }}</span>
            <UButton
              icon="i-lucide-copy"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="copyToClipboard(row.original.betterenrich_response.data.email, 'Email')"
            />
          </div>
          <span v-else class="text-muted text-sm">—</span>
        </template>

        <template #linkedinTitle-cell="{ row }">
          <div
            class="text-sm text-muted"
            :title="row.original.linkedinTitle"
          >
            {{ row.original.linkedinTitle ? row.original.linkedinTitle.split(' ').slice(0, 5).join(' ') + (row.original.linkedinTitle.split(' ').length > 5 ? '...' : '') : '—' }}
          </div>
        </template>

        <template #type-cell="{ row }">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
            :class="{
              'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': row.original.type === 'agency',
              'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200': row.original.type !== 'agency'
            }"
          >
            {{ row.original.type }}
          </span>
        </template>

        <template #qualified-cell="{ row }">
          <span
            class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
            :class="{
              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': row.original.qualified === true || row.original.qualified === 'TRUE',
              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': row.original.qualified === false || row.original.qualified === 'FALSE'
            }"
          >
            {{ row.original.qualified === true || row.original.qualified === 'TRUE' ? 'Yes' : 'No' }}
          </span>
        </template>

        <template #custom_prompt-cell="{ row }">
          <div class="flex items-center gap-2">
            <span class="text-sm truncate max-w-[250px]" :title="row.original.custom_prompt">
              {{ row.original.custom_prompt || '—' }}
            </span>
            <UButton
              v-if="row.original.custom_prompt"
              icon="i-lucide-copy"
              color="neutral"
              variant="ghost"
              size="xs"
              @click="copyToClipboard(row.original.custom_prompt, 'Custom prompt')"
            />
          </div>
        </template>

        <template #created_at-cell="{ row }">
          {{ formatDate(row.original.created_at) }}
        </template>
      </UTable>

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          {{ data.length }} lead(s) total
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
