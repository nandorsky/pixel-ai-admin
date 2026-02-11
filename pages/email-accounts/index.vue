<script setup lang="ts">
interface EmailAccount {
  id: number
  name: string
  email: string
  status: string
  type: string
  daily_limit: number
  emails_sent_count: number
  bounced_count: number
  total_replied_count: number
  unique_replied_count: number
  total_opened_count: number
  unique_opened_count: number
  unsubscribed_count: number
  total_leads_contacted_count: number
  interested_leads_count: number
  tags: { id: number; name: string; default: boolean }[]
}

interface WarmupStats {
  id: number
  email: string
  name: string
  domain: string
  warmup_emails_sent: number
  warmup_replies_received: number
  warmup_emails_saved_from_spam: number
  warmup_score: number
  warmup_bounces_received_count: number
  warmup_bounces_caused_count: number
  warmup_disabled_for_bouncing_count: number
}

interface AccountCampaign {
  id: number
  name: string
  status: string
  emails_sent: number
  bounced: number
  total_leads_contacted: number
}

interface MergedAccount extends EmailAccount {
  warmup?: WarmupStats
  bounceRate: number
  campaigns?: AccountCampaign[]
  loadingCampaigns?: boolean
}

// Deduplicated campaign with all flagged accounts that belong to it
interface CampaignGroup {
  id: number
  name: string
  status: string
  emails_sent: number
  bounced: number
  total_leads_contacted: number
  flaggedAccounts: { id: number; email: string; name: string; bounceRate: number }[]
  expanded: boolean
}

const toast = useToast()

const accounts = ref<MergedAccount[]>([])
const isLoading = ref(true)
const sortKey = ref<'bounceRate' | 'emails_sent_count' | 'warmup_score' | 'email'>('bounceRate')
const sortDir = ref<'asc' | 'desc'>('desc')

// Threshold feature
const bounceThreshold = ref(5)
const showThresholdPanel = ref(false)
const isScanningCampaigns = ref(false)
const selectedCampaignIds = ref<Set<number>>(new Set())
const isBulkRemoving = ref(false)
const removingCampaignId = ref<number | null>(null)

function getBounceRate(account: EmailAccount): number {
  if (!account.emails_sent_count || account.emails_sent_count === 0) return 0
  return (account.bounced_count / account.emails_sent_count) * 100
}

function getHealthStatus(account: MergedAccount): 'good' | 'warning' | 'critical' {
  if (account.bounceRate >= 5) return 'critical'
  if (account.bounceRate >= 2) return 'warning'
  if (account.warmup?.warmup_disabled_for_bouncing_count && account.warmup.warmup_disabled_for_bouncing_count > 0) return 'critical'
  if (account.status !== 'Connected') return 'critical'
  return 'good'
}

function getHealthColor(health: 'good' | 'warning' | 'critical') {
  switch (health) {
    case 'good': return 'success'
    case 'warning': return 'warning'
    case 'critical': return 'error'
  }
}

function getHealthLabel(health: 'good' | 'warning' | 'critical') {
  switch (health) {
    case 'good': return 'Healthy'
    case 'warning': return 'Warning'
    case 'critical': return 'Critical'
  }
}

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'connected': return 'success'
    case 'disconnected': return 'error'
    default: return 'neutral'
  }
}

function getCampaignStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'running': return 'success'
    case 'paused': return 'warning'
    case 'draft': return 'neutral'
    case 'completed': return 'info'
    default: return 'neutral'
  }
}

function toggleSort(key: typeof sortKey.value) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = key === 'email' ? 'asc' : 'desc'
  }
}

const sortedAccounts = computed(() => {
  return [...accounts.value].sort((a, b) => {
    let aVal: any, bVal: any
    switch (sortKey.value) {
      case 'bounceRate':
        aVal = a.bounceRate
        bVal = b.bounceRate
        break
      case 'emails_sent_count':
        aVal = a.emails_sent_count
        bVal = b.emails_sent_count
        break
      case 'warmup_score':
        aVal = a.warmup?.warmup_score ?? 0
        bVal = b.warmup?.warmup_score ?? 0
        break
      case 'email':
        aVal = a.email.toLowerCase()
        bVal = b.email.toLowerCase()
        break
    }
    if (aVal < bVal) return sortDir.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDir.value === 'asc' ? 1 : -1
    return 0
  })
})

const flaggedAccounts = computed(() => {
  return accounts.value
    .filter(a => a.bounceRate >= bounceThreshold.value)
    .sort((a, b) => b.bounceRate - a.bounceRate)
})

// Deduplicate campaigns across all flagged accounts, grouping flagged accounts per campaign
const campaignGroups = computed<CampaignGroup[]>(() => {
  const map = new Map<number, CampaignGroup>()

  for (const account of flaggedAccounts.value) {
    if (!account.campaigns) continue
    for (const campaign of account.campaigns) {
      let group = map.get(campaign.id)
      if (!group) {
        group = {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          emails_sent: campaign.emails_sent,
          bounced: campaign.bounced,
          total_leads_contacted: campaign.total_leads_contacted,
          flaggedAccounts: [],
          expanded: false
        }
        map.set(campaign.id, group)
      }
      group.flaggedAccounts.push({
        id: account.id,
        email: account.email,
        name: account.name,
        bounceRate: account.bounceRate
      })
    }
  }

  // Sort by number of flagged accounts (most first)
  return Array.from(map.values()).sort((a, b) => b.flaggedAccounts.length - a.flaggedAccounts.length)
})

const summaryStats = computed(() => {
  const total = accounts.value.length
  const connected = accounts.value.filter(a => a.status?.toLowerCase() === 'connected').length
  const critical = accounts.value.filter(a => getHealthStatus(a) === 'critical').length
  const warning = accounts.value.filter(a => getHealthStatus(a) === 'warning').length
  const totalSent = accounts.value.reduce((sum, a) => sum + (a.emails_sent_count || 0), 0)
  const totalBounced = accounts.value.reduce((sum, a) => sum + (a.bounced_count || 0), 0)
  const avgBounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0
  return { total, connected, critical, warning, totalSent, totalBounced, avgBounceRate }
})

function getSortIcon(key: typeof sortKey.value) {
  if (sortKey.value !== key) return 'i-lucide-arrow-up-down'
  return sortDir.value === 'asc' ? 'i-lucide-arrow-up' : 'i-lucide-arrow-down'
}

async function fetchData() {
  isLoading.value = true
  try {
    const [emailResponse, warmupResponse] = await Promise.all([
      $fetch('/api/email-bison/sender-emails'),
      $fetch('/api/email-bison/warmup/sender-emails').catch(() => null)
    ])

    const emailAccounts: EmailAccount[] = (emailResponse as any)?.data || emailResponse || []
    const warmupData: WarmupStats[] = (warmupResponse as any)?.data || warmupResponse || []

    const warmupMap = new Map<number, WarmupStats>()
    warmupData.forEach((w: WarmupStats) => warmupMap.set(w.id, w))

    accounts.value = emailAccounts.map(account => ({
      ...account,
      warmup: warmupMap.get(account.id),
      bounceRate: getBounceRate(account),
      campaigns: undefined,
      loadingCampaigns: false
    }))
  } catch (error: any) {
    toast.add({
      title: 'Error fetching email accounts',
      description: error.message,
      color: 'error'
    })
  }
  isLoading.value = false
}

async function scanFlaggedCampaigns() {
  showThresholdPanel.value = true
  isScanningCampaigns.value = true
  selectedCampaignIds.value = new Set()

  const flagged = flaggedAccounts.value
  await Promise.all(flagged.map(async (account) => {
    account.loadingCampaigns = true
    try {
      const response = await $fetch(`/api/email-bison/sender-emails/${account.id}/campaigns`)
      account.campaigns = ((response as any)?.data || response || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        emails_sent: c.emails_sent || 0,
        bounced: c.bounced || 0,
        total_leads_contacted: c.total_leads_contacted || 0
      }))
    } catch {
      account.campaigns = []
    }
    account.loadingCampaigns = false
  }))

  isScanningCampaigns.value = false
}

function isActiveCampaign(campaignStatus: string): boolean {
  const s = campaignStatus?.toLowerCase()
  return s === 'active' || s === 'running'
}

async function pauseCampaign(campaignId: number) {
  await $fetch(`/api/email-bison/campaigns/${campaignId}/pause`, { method: 'PATCH' })
}

async function resumeCampaign(campaignId: number) {
  await $fetch(`/api/email-bison/campaigns/${campaignId}/resume`, { method: 'PATCH' })
}

// Campaign selection
function toggleCampaignSelected(campaignId: number) {
  const next = new Set(selectedCampaignIds.value)
  if (next.has(campaignId)) {
    next.delete(campaignId)
  } else {
    next.add(campaignId)
  }
  selectedCampaignIds.value = next
}

function selectAllCampaigns() {
  selectedCampaignIds.value = new Set(campaignGroups.value.map(g => g.id))
}

function selectNoneCampaigns() {
  selectedCampaignIds.value = new Set()
}

function toggleGroupExpanded(group: CampaignGroup) {
  group.expanded = !group.expanded
}

// Remove all flagged accounts from a single campaign
async function removeFromSingleCampaign(group: CampaignGroup) {
  removingCampaignId.value = group.id
  const wasActive = isActiveCampaign(group.status)
  const senderEmailIds = group.flaggedAccounts.map(a => a.id)

  try {
    if (wasActive) {
      group.status = 'Pausing...'
      await pauseCampaign(group.id)
      group.status = 'Paused'
    }

    group.status = wasActive ? 'Removing...' : group.status
    await $fetch(`/api/email-bison/campaigns/${group.id}/remove-sender-emails`, {
      method: 'DELETE',
      body: { sender_email_ids: senderEmailIds }
    })

    if (wasActive) {
      group.status = 'Resuming...'
      await resumeCampaign(group.id)
      group.status = 'Active'
    }

    // Remove this campaign from all flagged accounts' campaign lists
    for (const account of flaggedAccounts.value) {
      if (account.campaigns) {
        account.campaigns = account.campaigns.filter(c => c.id !== group.id)
      }
    }

    toast.add({
      title: 'Removed',
      description: `${senderEmailIds.length} flagged account${senderEmailIds.length === 1 ? '' : 's'} removed from "${group.name}"${wasActive ? ' (paused → removed → resumed)' : ''}`,
      color: 'success'
    })
  } catch (error: any) {
    if (wasActive && group.status !== 'Pausing...') {
      try {
        await resumeCampaign(group.id)
        group.status = 'Active'
      } catch {
        group.status = 'Paused'
        toast.add({
          title: 'Warning',
          description: `"${group.name}" was paused but could not be resumed. Please resume it manually.`,
          color: 'warning'
        })
      }
    }
    toast.add({
      title: 'Failed to remove',
      description: error.message || 'Something went wrong',
      color: 'error'
    })
  }
  removingCampaignId.value = null
}

// Bulk remove from all selected campaigns
async function bulkRemoveFromSelected() {
  if (selectedCampaignIds.value.size === 0) return

  isBulkRemoving.value = true
  const toProcess = campaignGroups.value.filter(g => selectedCampaignIds.value.has(g.id))
  let processed = 0

  for (const group of toProcess) {
    await removeFromSingleCampaign(group)
    processed++
  }

  selectedCampaignIds.value = new Set()
  isBulkRemoving.value = false
  toast.add({
    title: 'Bulk removal complete',
    description: `Processed ${processed} campaign${processed === 1 ? '' : 's'}`,
    color: 'success'
  })
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <UDashboardPanel id="email-accounts">
    <template #header>
      <UDashboardNavbar title="Email Accounts">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            :loading="isLoading"
            @click="fetchData"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-muted" />
      </div>

      <template v-else>
        <!-- Summary Cards -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4">
          <div class="rounded-lg border border-default p-4">
            <div class="text-xs text-muted mb-1">Total Accounts</div>
            <div class="text-2xl font-semibold">{{ summaryStats.total }}</div>
            <div class="text-xs text-muted mt-1">{{ summaryStats.connected }} connected</div>
          </div>
          <div class="rounded-lg border border-default p-4">
            <div class="text-xs text-muted mb-1">Avg Bounce Rate</div>
            <div class="text-2xl font-semibold" :class="summaryStats.avgBounceRate >= 5 ? 'text-red-500' : summaryStats.avgBounceRate >= 2 ? 'text-amber-500' : 'text-green-500'">
              {{ summaryStats.avgBounceRate.toFixed(1) }}%
            </div>
            <div class="text-xs text-muted mt-1">{{ summaryStats.totalBounced }} / {{ summaryStats.totalSent }} emails</div>
          </div>
          <div class="rounded-lg border border-default p-4">
            <div class="text-xs text-muted mb-1">Critical</div>
            <div class="text-2xl font-semibold" :class="summaryStats.critical > 0 ? 'text-red-500' : ''">
              {{ summaryStats.critical }}
            </div>
            <div class="text-xs text-muted mt-1">accounts need attention</div>
          </div>
          <div class="rounded-lg border border-default p-4">
            <div class="text-xs text-muted mb-1">Warning</div>
            <div class="text-2xl font-semibold" :class="summaryStats.warning > 0 ? 'text-amber-500' : ''">
              {{ summaryStats.warning }}
            </div>
            <div class="text-xs text-muted mt-1">accounts to monitor</div>
          </div>
        </div>

        <!-- Bounce Threshold Tool -->
        <div class="mx-4 mb-4 rounded-lg border border-default p-4">
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-shield-alert" class="w-5 h-5 text-amber-500" />
              <span class="font-medium text-sm">Bounce Rate Threshold</span>
            </div>
            <div class="flex items-center gap-2">
              <input
                v-model.number="bounceThreshold"
                type="number"
                min="0"
                max="100"
                step="0.5"
                class="w-20 rounded-md border border-default bg-default px-2 py-1 text-sm text-center"
              />
              <span class="text-sm text-muted">%</span>
            </div>
            <UButton
              icon="i-lucide-scan-search"
              label="Scan Flagged Accounts"
              color="warning"
              variant="soft"
              size="sm"
              :loading="isScanningCampaigns"
              @click="scanFlaggedCampaigns"
            />
            <span class="text-sm text-muted">
              {{ flaggedAccounts.length }} account{{ flaggedAccounts.length === 1 ? '' : 's' }} above threshold
            </span>
          </div>

          <!-- Scan Results Panel -->
          <div v-if="showThresholdPanel" class="mt-4">
            <!-- Scanning -->
            <div v-if="isScanningCampaigns" class="flex items-center gap-2 py-4 text-sm text-muted">
              <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin" />
              Scanning campaigns for {{ flaggedAccounts.length }} flagged accounts...
            </div>

            <template v-else>
              <!-- No flagged accounts -->
              <div v-if="flaggedAccounts.length === 0" class="py-4 text-sm text-muted text-center">
                No accounts exceed the {{ bounceThreshold }}% bounce rate threshold.
              </div>

              <!-- No campaigns found -->
              <div v-else-if="campaignGroups.length === 0" class="py-4 text-sm text-muted text-center">
                {{ flaggedAccounts.length }} flagged account{{ flaggedAccounts.length === 1 ? '' : 's' }} found, but none are assigned to campaigns.
              </div>

              <template v-else>
                <!-- Campaign selection header -->
                <div class="flex items-center justify-between mb-3 pb-3 border-b border-default">
                  <div class="flex items-center gap-3">
                    <span class="text-sm font-medium">
                      {{ campaignGroups.length }} campaign{{ campaignGroups.length === 1 ? '' : 's' }} contain flagged accounts
                    </span>
                    <button
                      class="text-xs font-medium hover:text-primary"
                      :class="selectedCampaignIds.size === campaignGroups.length ? 'text-primary' : 'text-muted'"
                      @click="selectedCampaignIds.size === campaignGroups.length ? selectNoneCampaigns() : selectAllCampaigns()"
                    >
                      {{ selectedCampaignIds.size === campaignGroups.length ? 'Deselect All' : 'Select All' }}
                    </button>
                  </div>
                  <UButton
                    icon="i-lucide-trash-2"
                    :label="`Remove Flagged from ${selectedCampaignIds.size} Campaign${selectedCampaignIds.size === 1 ? '' : 's'}`"
                    color="error"
                    variant="soft"
                    size="sm"
                    :loading="isBulkRemoving"
                    :disabled="selectedCampaignIds.size === 0"
                    @click="bulkRemoveFromSelected"
                  />
                </div>

                <!-- Campaign list -->
                <div class="space-y-2">
                  <div
                    v-for="group in campaignGroups"
                    :key="group.id"
                    class="rounded-lg border overflow-hidden"
                    :class="selectedCampaignIds.has(group.id) ? 'border-primary/50 bg-primary/5' : 'border-default'"
                  >
                    <!-- Campaign row -->
                    <div class="flex items-center justify-between p-3">
                      <div class="flex items-center gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          :checked="selectedCampaignIds.has(group.id)"
                          class="rounded border-default shrink-0"
                          @change="toggleCampaignSelected(group.id)"
                        />
                        <button
                          class="flex items-center gap-2 min-w-0 text-left"
                          @click="toggleGroupExpanded(group)"
                        >
                          <UIcon
                            :name="group.expanded ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                            class="w-4 h-4 text-muted shrink-0"
                          />
                          <div class="min-w-0">
                            <div class="font-medium text-sm truncate">{{ group.name }}</div>
                            <div class="text-xs text-muted">
                              {{ group.emails_sent }} sent · {{ group.bounced }} bounced · {{ group.total_leads_contacted }} leads
                            </div>
                          </div>
                        </button>
                      </div>
                      <div class="flex items-center gap-2 shrink-0 ml-3">
                        <UBadge :color="getCampaignStatusColor(group.status)" variant="subtle" size="sm">
                          {{ group.status }}
                        </UBadge>
                        <UBadge color="error" variant="subtle" size="sm">
                          {{ group.flaggedAccounts.length }} flagged
                        </UBadge>
                        <UButton
                          icon="i-lucide-trash-2"
                          :label="isActiveCampaign(group.status) ? 'Pause & Remove' : 'Remove'"
                          color="error"
                          variant="soft"
                          size="xs"
                          :loading="removingCampaignId === group.id"
                          @click="removeFromSingleCampaign(group)"
                        />
                      </div>
                    </div>

                    <!-- Expanded: show flagged accounts in this campaign -->
                    <div v-if="group.expanded" class="border-t border-default bg-elevated/20 px-3 py-2">
                      <div class="text-xs text-muted mb-2">Flagged accounts that will be removed:</div>
                      <div class="space-y-1">
                        <div
                          v-for="acct in group.flaggedAccounts"
                          :key="acct.id"
                          class="flex items-center justify-between text-sm py-1"
                        >
                          <div>
                            <span class="font-medium">{{ acct.email }}</span>
                            <span class="text-xs text-muted ml-2">{{ acct.name }}</span>
                          </div>
                          <span class="text-red-500 font-medium text-xs">{{ acct.bounceRate.toFixed(1) }}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </template>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="accounts.length === 0" class="text-center py-12 text-muted">
          No email accounts found
        </div>

        <!-- Accounts Table -->
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-default bg-elevated/50">
                <th class="text-left py-3 px-4 font-medium">
                  <button class="flex items-center gap-1 hover:text-primary" @click="toggleSort('email')">
                    Email Account
                    <UIcon :name="getSortIcon('email')" class="w-3 h-3" />
                  </button>
                </th>
                <th class="text-left py-3 px-4 font-medium">Status</th>
                <th class="text-left py-3 px-4 font-medium">Health</th>
                <th class="text-right py-3 px-4 font-medium">
                  <button class="flex items-center gap-1 hover:text-primary ml-auto" @click="toggleSort('emails_sent_count')">
                    Sent
                    <UIcon :name="getSortIcon('emails_sent_count')" class="w-3 h-3" />
                  </button>
                </th>
                <th class="text-right py-3 px-4 font-medium">Bounced</th>
                <th class="text-right py-3 px-4 font-medium">
                  <button class="flex items-center gap-1 hover:text-primary ml-auto" @click="toggleSort('bounceRate')">
                    Bounce Rate
                    <UIcon :name="getSortIcon('bounceRate')" class="w-3 h-3" />
                  </button>
                </th>
                <th class="text-right py-3 px-4 font-medium">Replies</th>
                <th class="text-right py-3 px-4 font-medium">Interested</th>
                <th class="text-right py-3 px-4 font-medium">
                  <button class="flex items-center gap-1 hover:text-primary ml-auto" @click="toggleSort('warmup_score')">
                    Warmup Score
                    <UIcon :name="getSortIcon('warmup_score')" class="w-3 h-3" />
                  </button>
                </th>
                <th class="text-right py-3 px-4 font-medium">Daily Limit</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="account in sortedAccounts"
                :key="account.id"
                class="border-b border-default hover:bg-elevated/30"
              >
                <td class="py-3 px-4">
                  <div class="font-medium">{{ account.email }}</div>
                  <div class="text-xs text-muted">{{ account.name }}</div>
                </td>
                <td class="py-3 px-4">
                  <UBadge :color="getStatusColor(account.status)" variant="subtle" size="sm">
                    {{ account.status }}
                  </UBadge>
                </td>
                <td class="py-3 px-4">
                  <UBadge :color="getHealthColor(getHealthStatus(account))" variant="subtle" size="sm">
                    {{ getHealthLabel(getHealthStatus(account)) }}
                  </UBadge>
                </td>
                <td class="text-right py-3 px-4 font-medium">
                  {{ account.emails_sent_count }}
                </td>
                <td class="text-right py-3 px-4">
                  {{ account.bounced_count }}
                </td>
                <td class="text-right py-3 px-4">
                  <span :class="account.bounceRate >= 5 ? 'text-red-500 font-semibold' : account.bounceRate >= 2 ? 'text-amber-500 font-medium' : 'text-green-500'">
                    {{ account.bounceRate.toFixed(1) }}%
                  </span>
                </td>
                <td class="text-right py-3 px-4 text-purple-600">
                  {{ account.unique_replied_count }}
                  <span v-if="account.emails_sent_count" class="text-xs text-muted">
                    ({{ ((account.unique_replied_count / account.emails_sent_count) * 100).toFixed(1) }}%)
                  </span>
                </td>
                <td class="text-right py-3 px-4 text-green-600">
                  {{ account.interested_leads_count }}
                </td>
                <td class="text-right py-3 px-4">
                  <template v-if="account.warmup">
                    <span :class="account.warmup.warmup_score >= 80 ? 'text-green-500' : account.warmup.warmup_score >= 50 ? 'text-amber-500' : 'text-red-500'" class="font-medium">
                      {{ account.warmup.warmup_score }}
                    </span>
                    <div class="text-xs text-muted">
                      {{ account.warmup.warmup_emails_saved_from_spam }} saved from spam
                    </div>
                  </template>
                  <span v-else class="text-xs text-muted">N/A</span>
                </td>
                <td class="text-right py-3 px-4 text-muted">
                  {{ account.daily_limit }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>
  </UDashboardPanel>
</template>
