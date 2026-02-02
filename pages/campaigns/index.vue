<script setup lang="ts">
interface Campaign {
  id: number
  name: string
  status: string
}

interface CampaignStats {
  emails_sent: string
  total_leads_contacted: string
  unique_opens_per_contact: string
  unique_opens_per_contact_percentage: string
  unique_replies_per_contact: string
  unique_replies_per_contact_percentage: string
  bounced: string
  bounced_percentage: string
  unsubscribed: string
  unsubscribed_percentage: string
  interested: string
  interested_percentage: string
}

interface CampaignWithStats extends Campaign {
  stats?: CampaignStats
  loadingStats?: boolean
}

const toast = useToast()

const campaigns = ref<CampaignWithStats[]>([])
const isLoading = ref(true)

function getStatusOrder(status: string): number {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'running':
      return 0
    case 'paused':
      return 1
    case 'completed':
      return 2
    case 'draft':
      return 3
    default:
      return 4
  }
}

async function fetchCampaigns() {
  isLoading.value = true
  try {
    const response = await $fetch('/api/email-bison/campaigns')
    const allCampaigns = ((response as any)?.data || response || [])
      // Filter out archived
      .filter((c: Campaign) => c.status?.toLowerCase() !== 'archived')
      // Sort: active first, then completed
      .sort((a: Campaign, b: Campaign) => getStatusOrder(a.status) - getStatusOrder(b.status))

    campaigns.value = allCampaigns.map((c: Campaign) => ({
      ...c,
      stats: undefined,
      loadingStats: true
    }))
    // Fetch stats for each campaign
    await Promise.all(campaigns.value.map(campaign => fetchCampaignStats(campaign)))
  } catch (error: any) {
    toast.add({
      title: 'Error fetching campaigns',
      description: error.message,
      color: 'error'
    })
  }
  isLoading.value = false
}

async function fetchCampaignStats(campaign: CampaignWithStats) {
  campaign.loadingStats = true
  try {
    const response = await $fetch(`/api/email-bison/campaigns/${campaign.id}/stats`, {
      method: 'POST',
      body: {}
    })
    campaign.stats = (response as any)?.data || response
  } catch (error: any) {
    console.error(`Failed to fetch stats for campaign ${campaign.id}:`, error)
  }
  campaign.loadingStats = false
}

onMounted(() => {
  fetchCampaigns()
})

function getStatusColor(status: string) {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'running':
      return 'success'
    case 'paused':
      return 'warning'
    case 'draft':
      return 'neutral'
    case 'completed':
      return 'info'
    default:
      return 'neutral'
  }
}
</script>

<template>
  <UDashboardPanel id="campaigns">
    <template #header>
      <UDashboardNavbar title="Campaigns">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            :loading="isLoading"
            @click="fetchCampaigns"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading State -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-muted" />
      </div>

      <!-- Empty State -->
      <div v-else-if="campaigns.length === 0" class="text-center py-12 text-muted">
        No campaigns found
      </div>

      <!-- Campaigns Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-default bg-elevated/50">
              <th class="text-left py-3 px-4 font-medium">Campaign</th>
              <th class="text-left py-3 px-4 font-medium">Status</th>
              <th class="text-right py-3 px-4 font-medium">Sent</th>
              <th class="text-right py-3 px-4 font-medium">Leads</th>
              <th class="text-right py-3 px-4 font-medium">Replies</th>
              <th class="text-right py-3 px-4 font-medium">Interested</th>
              <th class="text-right py-3 px-4 font-medium">Bounced</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="campaign in campaigns"
              :key="campaign.id"
              class="border-b border-default hover:bg-elevated/30"
            >
              <td class="py-3 px-4">
                <div class="font-medium">{{ campaign.name }}</div>
                <div class="text-xs text-muted">ID: {{ campaign.id }}</div>
              </td>
              <td class="py-3 px-4">
                <UBadge :color="getStatusColor(campaign.status)" variant="subtle" size="sm">
                  {{ campaign.status }}
                </UBadge>
              </td>
              <template v-if="campaign.loadingStats">
                <td colspan="5" class="py-3 px-4 text-center">
                  <UIcon name="i-lucide-loader-2" class="w-4 h-4 animate-spin text-muted" />
                </td>
              </template>
              <template v-else-if="campaign.stats">
                <td class="text-right py-3 px-4 font-medium">{{ campaign.stats.emails_sent }}</td>
                <td class="text-right py-3 px-4">{{ campaign.stats.total_leads_contacted }}</td>
                <td class="text-right py-3 px-4 text-purple-600">
                  {{ campaign.stats.unique_replies_per_contact }}
                  <span class="text-xs text-muted">({{ campaign.stats.unique_replies_per_contact_percentage }}%)</span>
                </td>
                <td class="text-right py-3 px-4 text-green-600">
                  {{ campaign.stats.interested }}
                  <span class="text-xs text-muted">({{ campaign.stats.interested_percentage }}%)</span>
                </td>
                <td class="text-right py-3 px-4 text-red-600">
                  {{ campaign.stats.bounced }}
                  <span class="text-xs text-muted">({{ campaign.stats.bounced_percentage }}%)</span>
                </td>
              </template>
              <template v-else>
                <td colspan="5" class="py-3 px-4 text-center text-muted text-xs">
                  Unable to load stats
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </UDashboardPanel>
</template>
