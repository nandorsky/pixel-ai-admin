<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel, getExpandedRowModel } from '@tanstack/table-core'

const supabase = useSupabase()

interface ReferredUser {
  email: string
  created_at: string
}

interface Referrer {
  email: string
  referral_code: string
  referred: number
  last_referral: string
  referred_users: ReferredUser[]
}

const toast = useToast()
const table = useTemplateRef('table')

const columnFilters = ref([{
  id: 'email',
  value: ''
}])
const expanded = ref({})

const data = ref<Referrer[]>([])
const isFetching = ref(true)

async function fetchReferrals() {
  isFetching.value = true

  // Fetch all signups
  const { data: signups, error } = await supabase
    .from('signups')
    .select('email, referral_code, referred_by, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    toast.add({
      title: 'Error fetching referrals',
      description: error.message,
      color: 'error'
    })
    isFetching.value = false
    return
  }

  // Build a map of referral_code -> email
  const codeToEmail = new Map<string, string>()
  signups?.forEach(signup => {
    codeToEmail.set(signup.referral_code, signup.email)
  })

  // Track referrals by referral_code
  const referralData = new Map<string, { lastDate: string; users: ReferredUser[] }>()

  signups?.forEach(signup => {
    if (signup.referred_by) {
      const existing = referralData.get(signup.referred_by)
      if (existing) {
        existing.users.push({
          email: signup.email,
          created_at: signup.created_at
        })
        // Keep the most recent date
        if (new Date(signup.created_at) > new Date(existing.lastDate)) {
          existing.lastDate = signup.created_at
        }
      } else {
        referralData.set(signup.referred_by, {
          lastDate: signup.created_at,
          users: [{
            email: signup.email,
            created_at: signup.created_at
          }]
        })
      }
    }
  })

  // Build the referrers array
  const referrers: Referrer[] = []
  referralData.forEach((stats, referralCode) => {
    const email = codeToEmail.get(referralCode)
    if (email) {
      referrers.push({
        email,
        referral_code: referralCode,
        referred: stats.users.length,
        last_referral: stats.lastDate,
        referred_users: stats.users.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      })
    }
  })

  // Sort by number of referrals descending
  referrers.sort((a, b) => b.referred - a.referred)

  data.value = referrers
  isFetching.value = false
}

onMounted(() => {
  fetchReferrals()
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

const columns: TableColumn<Referrer>[] = [
  {
    id: 'expand',
    header: '',
    cell: ({ row }) => {
      return row.getCanExpand() ? '' : ''
    }
  },
  {
    accessorKey: 'email',
    header: 'Email'
  },
  {
    accessorKey: 'referred',
    header: 'Users Referred'
  },
  {
    accessorKey: 'last_referral',
    header: 'Last Referral'
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
  pageSize: 10
})
</script>

<template>
  <UDashboardPanel id="referrals">
    <template #header>
      <UDashboardNavbar title="Referrals">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UInput
        v-model="email"
        class="max-w-sm"
        icon="i-lucide-search"
        placeholder="Filter emails..."
      />

      <UTable
        ref="table"
        v-model:column-filters="columnFilters"
        v-model:pagination="pagination"
        v-model:expanded="expanded"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel()
        }"
        :expand-options="{
          getExpandedRowModel: getExpandedRowModel()
        }"
        :get-row-can-expand="() => true"
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
        <template #expand-cell="{ row }">
          <UButton
            :icon="row.getIsExpanded() ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="row.toggleExpanded()"
          />
        </template>

        <template #email-cell="{ row }">
          {{ row.original.email }}
        </template>

        <template #referred-cell="{ row }">
          <UBadge color="primary" variant="subtle">
            {{ row.original.referred }}
          </UBadge>
        </template>

        <template #last_referral-cell="{ row }">
          {{ formatDate(row.original.last_referral) }}
        </template>

        <template #expanded="{ row }">
          <div class="p-4 bg-elevated/30">
            <p class="text-sm font-medium text-highlighted mb-3">
              Users referred by {{ row.original.email }}
            </p>
            <div class="space-y-2">
              <div
                v-for="user in row.original.referred_users"
                :key="user.email"
                class="flex items-center justify-between p-2 rounded-lg bg-default/50 border border-default"
              >
                <div class="flex items-center gap-2">
                  <div class="size-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                    {{ user.email.charAt(0).toUpperCase() }}
                  </div>
                  <span class="text-sm">{{ user.email }}</span>
                </div>
                <span class="text-xs text-muted">{{ formatDate(user.created_at) }}</span>
              </div>
            </div>
          </div>
        </template>
      </UTable>

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          {{ data.length }} referrer(s) total
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
