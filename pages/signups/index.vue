<script setup lang="ts">
import { h } from 'vue'
import { upperFirst } from 'scule'
import type { TableColumn } from '@nuxt/ui'
import { getPaginationRowModel, getFilteredRowModel } from '@tanstack/table-core'
import { getSignupSource, getSourceColor } from '~/utils/signup-source'

const UCheckbox = resolveComponent('UCheckbox')

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
  username?: string
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
  product_access: boolean | null
  invite_sent_at: string | null
}

const toast = useToast()
const table = useTemplateRef('table')

const columnFilters = ref([{
  id: 'name',
  value: ''
}])
const columnVisibility = ref({
  source: true
})
const rowSelection = ref({})

const data = ref<Signup[]>([])
const referralCounts = ref<Record<string, number>>({})
const isFetching = ref(true)
const sourceFilter = ref('__all__')
const viewTab = ref('all')

const filteredData = computed(() => {
  if (viewTab.value === 'needs_invite') {
    return data.value.filter(s => s.product_access && !s.invite_sent_at)
  }
  return data.value
})

const needsInviteCount = computed(() =>
  data.value.filter(s => s.product_access && !s.invite_sent_at).length
)

const uniqueSources = computed(() => {
  const sources = new Set<string>()
  for (const s of data.value) {
    sources.add(getSignupSource(s))
  }
  return Array.from(sources).sort()
})

function getEarnedCredits(signup: Signup): number {
  const referrals = referralCounts.value[signup.referral_code] || 0
  return 500 + (referrals * 500)
}

function getTotalCredits(signup: Signup): number {
  return Math.max(1750, getEarnedCredits(signup))
}

async function fetchSignups() {
  isFetching.value = true
  const { data: signups, error } = await supabase
    .from('signups')
    .select('id, created_at, email, first_name, last_name, referral_code, referred_by, utm_parameters, linkedin_json, product_access, invite_sent_at')
    .order('created_at', { ascending: false })

  if (error) {
    toast.add({
      title: 'Error fetching signups',
      description: error.message,
      color: 'error'
    })
  } else {
    data.value = signups || []
    // Build referral count map
    const counts: Record<string, number> = {}
    for (const s of data.value) {
      if (s.referred_by) {
        counts[s.referred_by] = (counts[s.referred_by] || 0) + 1
      }
    }
    referralCounts.value = counts
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

const updatingAccess = ref<Set<string>>(new Set())

async function toggleAccess(signup: Signup) {
  updatingAccess.value.add(signup.id)
  const newValue = !signup.product_access

  const { error } = await supabase
    .from('signups')
    .update({ product_access: newValue })
    .eq('id', signup.id)

  if (error) {
    toast.add({
      title: 'Error updating access',
      description: error.message,
      color: 'error'
    })
  } else {
    signup.product_access = newValue
    toast.add({
      title: newValue ? 'Access granted' : 'Access revoked',
      color: 'success'
    })
  }
  updatingAccess.value.delete(signup.id)
}

const grantingAccess = ref(false)

async function grantAccessBulk() {
  const selected = selectedRows.value
  if (selected.length === 0) return

  grantingAccess.value = true
  let successCount = 0
  let errorCount = 0

  for (const signup of selected) {
    if (signup.product_access) {
      successCount++
      continue
    }

    const { error } = await supabase
      .from('signups')
      .update({ product_access: true })
      .eq('id', signup.id)

    if (error) {
      errorCount++
    } else {
      signup.product_access = true
      successCount++
    }
  }

  if (errorCount > 0) {
    toast.add({
      title: 'Access update completed',
      description: `${successCount} granted, ${errorCount} failed`,
      color: 'warning'
    })
  } else {
    toast.add({
      title: 'Access granted',
      description: `${successCount} user${successCount > 1 ? 's' : ''} now have access`,
      color: 'success'
    })
  }

  rowSelection.value = {}
  grantingAccess.value = false
}

const sendingInvites = ref(false)
const showInviteModal = ref(false)
const inviteSubject = ref('')
const previewHtml = ref('')
const loadingPreview = ref(false)
const previewRef = ref<HTMLElement | null>(null)
const previewFirstName = ref('')
const previewCredits = ref(0)

const selectedRows = computed(() => {
  const indices = Object.keys(rowSelection.value).filter(k => rowSelection.value[k as keyof typeof rowSelection.value])
  return indices.map(i => data.value[Number(i)]).filter(Boolean)
})

async function openInviteModal() {
  const first = selectedRows.value[0]
  if (!first) return

  showInviteModal.value = true
  loadingPreview.value = true

  try {
    const { subject, html } = await $fetch('/api/signups/preview-invite', {
      method: 'POST',
      body: { id: first.id }
    }) as { subject: string; html: string }

    inviteSubject.value = subject
    previewHtml.value = html
    previewFirstName.value = first.first_name || ''
    previewCredits.value = getTotalCredits(first)
  } catch (err: any) {
    toast.add({
      title: 'Error loading preview',
      description: err.data?.message || err.message || 'Unknown error',
      color: 'error'
    })
    showInviteModal.value = false
  } finally {
    loadingPreview.value = false
  }
}

async function confirmSendInvites() {
  const selected = selectedRows.value
  if (selected.length === 0) return

  sendingInvites.value = true
  try {
    // Capture edited content and restore placeholders for per-recipient personalization
    const editedHtml = previewRef.value?.innerHTML || previewHtml.value
    const creditsStr = previewCredits.value.toLocaleString()
    const greeting = previewFirstName.value ? `Hey ${previewFirstName.value}, welcome` : 'Welcome'

    let htmlTemplate = editedHtml
      .replace(new RegExp(greeting.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '{{greeting}}')
      .replace(new RegExp(`<strong>${creditsStr} credits</strong>`, 'g'), '<strong>{{credits}} credits</strong>')

    let customSubject = inviteSubject.value
      .replace(new RegExp(creditsStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '{{credits}}')

    const { results } = await $fetch('/api/signups/send-invite', {
      method: 'POST',
      body: {
        ids: selected.map(s => s.id),
        subject: customSubject,
        htmlTemplate
      }
    }) as { results: { id: number; status: string; error?: string }[] }

    const sentCount = results.filter(r => r.status === 'sent').length
    const alreadySentCount = results.filter(r => r.status === 'already_sent').length
    const errorCount = results.filter(r => r.status === 'error').length

    // Update local state with invite_sent_at for sent items
    const now = new Date().toISOString()
    for (const result of results) {
      if (result.status === 'sent') {
        const signup = data.value.find(s => Number(s.id) === result.id)
        if (signup) signup.invite_sent_at = now
      }
    }

    const parts: string[] = []
    if (sentCount > 0) parts.push(`${sentCount} sent`)
    if (alreadySentCount > 0) parts.push(`${alreadySentCount} already invited`)
    if (errorCount > 0) parts.push(`${errorCount} failed`)

    const errors = results.filter(r => r.status === 'error' && r.error).map(r => r.error)
    const description = errors.length > 0
      ? `${parts.join(', ')} — ${errors.join('; ')}`
      : parts.join(', ')

    toast.add({
      title: 'Invite emails processed',
      description,
      color: errorCount > 0 ? 'warning' : 'success'
    })

    showInviteModal.value = false
    rowSelection.value = {}
  } catch (err: any) {
    toast.add({
      title: 'Error sending invites',
      description: err.data?.message || err.message || 'Unknown error',
      color: 'error'
    })
  } finally {
    sendingInvites.value = false
  }
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
    id: 'select',
    header: ({ table }) => h(UCheckbox, {
      'modelValue': table.getIsSomePageRowsSelected() ? 'indeterminate' : table.getIsAllPageRowsSelected(),
      'onUpdate:modelValue': (value: boolean | 'indeterminate') => table.toggleAllPageRowsSelected(!!value),
      'ariaLabel': 'Select all'
    }),
    cell: ({ row }) => h(UCheckbox, {
      'modelValue': row.getIsSelected(),
      'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
      'ariaLabel': 'Select row'
    })
  },
  {
    accessorKey: 'id',
    header: 'ID'
  },
  {
    id: 'name',
    header: 'Name',
    accessorFn: (row) => `${row.first_name || ''} ${row.last_name || ''}`.trim(),
    size: 200
  },
  {
    accessorKey: 'product_access',
    header: 'Status'
  },
  {
    id: 'source',
    header: 'Source',
    accessorFn: (row) => getSignupSource(row),
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true
      return row.getValue(columnId) === filterValue
    }
  },
  {
    accessorKey: 'created_at',
    header: 'Signed Up'
  },
]

const searchFilter = computed({
  get: (): string => {
    return (table.value?.tableApi?.getColumn('name')?.getFilterValue() as string) || ''
  },
  set: (value: string) => {
    table.value?.tableApi?.getColumn('name')?.setFilterValue(value || undefined)
  }
})

watch(sourceFilter, (val) => {
  table.value?.tableApi?.getColumn('source')?.setFilterValue(val === '__all__' ? undefined : val)
  pagination.value.pageIndex = 0
})

watch(viewTab, () => {
  rowSelection.value = {}
  pagination.value.pageIndex = 0
})

const pagination = ref({
  pageIndex: 0,
  pageSize: 50
})
</script>

<template>
  <UDashboardPanel id="waitlist">
    <template #header>
      <UDashboardNavbar title="Waitlist">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex items-center gap-4 border-b border-default mb-4 -mt-2">
        <button
          class="pb-2 text-sm font-medium border-b-2 transition-colors"
          :class="viewTab === 'all' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-default'"
          @click="viewTab = 'all'"
        >
          All ({{ data.length }})
        </button>
        <button
          class="pb-2 text-sm font-medium border-b-2 transition-colors"
          :class="viewTab === 'needs_invite' ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-default'"
          @click="viewTab = 'needs_invite'"
        >
          Needs Invite ({{ needsInviteCount }})
        </button>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <div class="flex items-center gap-1.5">
          <UInput
            v-model="searchFilter"
            class="max-w-sm"
            icon="i-lucide-search"
            placeholder="Search..."
          />
          <USelect
            v-model="sourceFilter"
            :items="[{ label: 'All Sources', value: '__all__' }, ...uniqueSources.map(s => ({ label: s, value: s }))]"
            value-key="value"
            class="w-44"
          />
        </div>

        <div class="flex flex-wrap items-center gap-1.5">
          <UButton
            v-if="selectedRows.length > 0"
            :label="`Grant Access (${selectedRows.length})`"
            icon="i-lucide-lock-open"
            color="success"
            :loading="grantingAccess"
            @click="grantAccessBulk"
          />
          <UButton
            v-if="selectedRows.length > 0"
            :label="`Send Invite Email (${selectedRows.length})`"
            icon="i-lucide-mail"
            color="primary"
            @click="openInviteModal"
          />
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
            <div v-else class="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-sm font-medium text-muted shrink-0">
              {{ [row.original.first_name, row.original.last_name].filter(Boolean).map(n => n.charAt(0)).join('').toUpperCase() || row.original.email.charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0">
              <div class="font-medium text-blue-600 dark:text-blue-400 hover:underline truncate flex items-center gap-2">
                <span>{{ row.original.first_name || '' }} {{ row.original.last_name || '' }}</span>
                <span class="text-xs font-normal text-amber-600 dark:text-amber-400">{{ getTotalCredits(row.original).toLocaleString() }} credits</span>
                <span class="text-xs font-normal text-green-600 dark:text-green-400">({{ getEarnedCredits(row.original).toLocaleString() }} earned)</span>
              </div>
              <div class="text-xs text-muted truncate">
                {{ row.original.email }}
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

        <template #product_access-cell="{ row }">
          <div class="flex items-center gap-1">
            <button
              class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              :disabled="updatingAccess.has(row.original.id)"
              :title="row.original.product_access ? 'Click to revoke access' : 'Click to grant access'"
              @click="toggleAccess(row.original)"
            >
              <UIcon
                v-if="updatingAccess.has(row.original.id)"
                name="i-lucide-loader-2"
                class="w-5 h-5 text-gray-400 animate-spin"
              />
              <UIcon
                v-else-if="row.original.product_access"
                name="i-lucide-lock-open"
                class="w-5 h-5 text-green-600"
              />
              <UIcon
                v-else
                name="i-lucide-lock"
                class="w-5 h-5 text-gray-400"
              />
            </button>
            <UIcon
              v-if="row.original.invite_sent_at"
              name="i-lucide-mail-check"
              class="w-5 h-5 text-green-600"
              :title="`Invited ${formatDate(row.original.invite_sent_at)}`"
            />
            <UIcon
              v-else
              name="i-lucide-mail-x"
              class="w-5 h-5 text-gray-400"
              title="Not invited"
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

  <UModal v-model:open="showInviteModal" title="Preview Invite Email" :ui="{ width: 'max-w-2xl' }">
    <template #body>
      <div class="space-y-4">
        <!-- Recipients -->
        <div>
          <label class="text-sm font-medium text-muted mb-1 block">To ({{ selectedRows.length }})</label>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="s in selectedRows.slice(0, 10)"
              :key="s.id"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-neutral-100 dark:bg-neutral-800 text-muted"
            >
              {{ s.first_name || s.email.split('@')[0] }} {{ s.last_name || '' }}
            </span>
            <span v-if="selectedRows.length > 10" class="text-xs text-muted self-center">
              +{{ selectedRows.length - 10 }} more
            </span>
          </div>
        </div>

        <!-- Subject -->
        <div>
          <label class="text-sm font-medium text-muted mb-1 block">Subject</label>
          <UInput v-model="inviteSubject" class="w-full" />
        </div>

        <!-- Preview -->
        <div>
          <label class="text-sm font-medium text-muted mb-1 block">Preview</label>
          <div v-if="loadingPreview" class="flex items-center justify-center py-12 rounded-lg border border-default bg-white">
            <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin text-muted" />
          </div>
          <div
            v-else
            ref="previewRef"
            contenteditable="true"
            class="rounded-lg border border-default bg-white p-4 overflow-auto max-h-96 focus:outline-none focus:ring-2 focus:ring-primary"
            v-html="previewHtml"
          />
          <p v-if="selectedRows.length > 1" class="text-xs text-muted mt-1">
            Showing preview for {{ selectedRows[0]?.first_name || selectedRows[0]?.email }}. Credits and referrals are personalized per recipient.
          </p>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-2 pt-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            @click="showInviteModal = false"
          />
          <UButton
            :label="`Send to ${selectedRows.length} recipient${selectedRows.length > 1 ? 's' : ''}`"
            icon="i-lucide-send"
            color="primary"
            :loading="sendingInvites"
            @click="confirmSendInvites"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
