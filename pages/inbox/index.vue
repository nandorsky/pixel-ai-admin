<script setup lang="ts">
interface Reply {
  id: number
  subject: string
  text_body: string
  html_body: string
  from_name: string
  from_email_address: string
  primary_to_email_address: string
  to: { name: string; address: string }[]
  folder: string
  read: boolean
  interested: boolean
  automated_reply: boolean
  date_received: string
  campaign_id: number | null
  attachments: { id: number; file_name: string; download_url: string }[]
}

interface ThreadData {
  current_reply: Reply
  older_messages: Reply[]
  newer_messages: Reply[]
}

interface Campaign {
  id: number
  name: string
  status: string
}

const toast = useToast()

// List state
const replies = ref<Reply[]>([])
const isFetching = ref(true)
const updatingIds = ref<Set<number>>(new Set())
const searchQuery = ref('')
const statusFilter = ref('not_automated_reply')
const folderFilter = ref('inbox')
const campaignFilter = ref('')

// Thread state
const selectedId = ref<number | null>(null)
const threadData = ref<ThreadData | null>(null)
const isLoadingThread = ref(false)

// Campaigns
const campaigns = ref<Campaign[]>([])
const campaignMap = computed(() => {
  const map: Record<number, string> = {}
  campaigns.value.forEach(c => map[c.id] = c.name)
  return map
})

// Track which messages we've replied to
const repliedToIds = ref<Set<number>>(new Set())

// Archive (stored locally)
const archivedIds = ref<Set<number>>(new Set())
const showArchived = ref(false)

function loadArchivedIds() {
  try {
    const stored = localStorage.getItem('inbox-archived-ids')
    if (stored) {
      archivedIds.value = new Set(JSON.parse(stored))
    }
  } catch (e) {
    console.error('Failed to load archived IDs:', e)
  }
}

function saveArchivedIds() {
  localStorage.setItem('inbox-archived-ids', JSON.stringify([...archivedIds.value]))
}

function archiveReply(replyId: number) {
  archivedIds.value.add(replyId)
  saveArchivedIds()
  toast.add({ title: 'Archived', color: 'success' })
}

function unarchiveReply(replyId: number) {
  archivedIds.value.delete(replyId)
  saveArchivedIds()
  toast.add({ title: 'Unarchived', color: 'success' })
}

const filteredReplies = computed(() => {
  if (showArchived.value) {
    return replies.value.filter(r => archivedIds.value.has(r.id))
  }
  return replies.value.filter(r => !archivedIds.value.has(r.id))
})

const statusOptions = [
  { label: 'All', value: '' },
  { label: 'Interested', value: 'interested' },
  { label: 'Automated Reply', value: 'automated_reply' },
  { label: 'Not Automated', value: 'not_automated_reply' }
]

const folderOptions = [
  { label: 'Inbox', value: 'inbox' },
  { label: 'Sent', value: 'sent' },
  { label: 'Spam', value: 'spam' },
  { label: 'Bounced', value: 'bounced' },
  { label: 'All', value: 'all' }
]

const campaignOptions = computed(() => [
  { label: 'All Campaigns', value: '' },
  ...campaigns.value.map(c => ({ label: c.name, value: String(c.id) }))
])

async function fetchCampaigns() {
  try {
    const response = await $fetch('/api/email-bison/campaigns')
    campaigns.value = (response as any)?.data || response || []
  } catch (error: any) {
    console.error('Failed to fetch campaigns:', error)
  }
}

async function fetchReplies() {
  isFetching.value = true

  const params: Record<string, string> = {}
  if (searchQuery.value) params.search = searchQuery.value
  if (statusFilter.value) params.status = statusFilter.value
  if (folderFilter.value) params.folder = folderFilter.value
  if (campaignFilter.value) params.campaign_id = campaignFilter.value

  try {
    // Fetch replies and sent messages in parallel
    const [repliesResponse, sentResponse] = await Promise.all([
      $fetch('/api/email-bison/replies', { params }),
      $fetch('/api/email-bison/replies', { params: { ...params, folder: 'sent' } })
    ])

    replies.value = (repliesResponse as any)?.data || repliesResponse || []

    // Build set of parent IDs from sent messages (these are messages we've replied to)
    const sentMessages = (sentResponse as any)?.data || sentResponse || []
    repliedToIds.value = new Set(
      sentMessages
        .filter((msg: any) => msg.parent_id)
        .map((msg: any) => msg.parent_id)
    )
  } catch (error: any) {
    toast.add({
      title: 'Error fetching replies',
      description: error.message || 'Failed to load inbox',
      color: 'error'
    })
    replies.value = []
  }

  isFetching.value = false
}

async function selectReply(reply: Reply) {
  selectedId.value = reply.id
  isLoadingThread.value = true
  threadData.value = null

  try {
    const response = await $fetch(`/api/email-bison/replies/${reply.id}/thread`)
    threadData.value = (response as any)?.data || response
  } catch (error: any) {
    toast.add({
      title: 'Error loading thread',
      description: error.message || 'Failed to load email thread',
      color: 'error'
    })
  }

  isLoadingThread.value = false
}

const allMessages = computed(() => {
  if (!threadData.value) return []
  const { older_messages, current_reply, newer_messages } = threadData.value
  const all = [
    ...(older_messages || []),
    current_reply,
    ...(newer_messages || [])
  ]
  const seen = new Set<number>()
  const unique = all.filter(msg => {
    if (seen.has(msg.id)) return false
    seen.add(msg.id)
    return true
  })
  return unique.sort((a, b) => new Date(b.date_received).getTime() - new Date(a.date_received).getTime())
})

onNuxtReady(() => {
  loadArchivedIds()
  fetchCampaigns()
  fetchReplies()
})

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDateLong(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function truncateText(text: string, maxLength: number = 50) {
  if (!text) return '—'
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null
function onSearch(value: string) {
  searchQuery.value = value
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    fetchReplies()
  }, 300)
}

watch([statusFilter, folderFilter, campaignFilter], () => {
  fetchReplies()
})

async function markAsInterested(reply: Reply) {
  updatingIds.value.add(reply.id)
  try {
    await $fetch(`/api/email-bison/replies/${reply.id}/mark-interested`, { method: 'PATCH' })
    reply.interested = true
    if (threadData.value?.current_reply?.id === reply.id) {
      threadData.value.current_reply.interested = true
    }
    toast.add({ title: 'Marked as interested', color: 'success' })
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  }
  updatingIds.value.delete(reply.id)
}

async function markAsNotInterested(reply: Reply) {
  updatingIds.value.add(reply.id)
  try {
    await $fetch(`/api/email-bison/replies/${reply.id}/mark-not-interested`, { method: 'PATCH' })
    reply.interested = false
    if (threadData.value?.current_reply?.id === reply.id) {
      threadData.value.current_reply.interested = false
    }
    toast.add({ title: 'Marked as not interested', color: 'success' })
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  }
  updatingIds.value.delete(reply.id)
}
</script>

<template>
  <UDashboardPanel id="inbox">
    <template #header>
      <UDashboardNavbar title="Inbox">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex h-full gap-0 -m-4">
        <!-- Left: Email List -->
        <div class="w-80 shrink-0 border-r border-default flex flex-col">
          <!-- Filters -->
          <div class="p-3 border-b border-default space-y-2">
            <UInput
              :model-value="searchQuery"
              @update:model-value="onSearch"
              icon="i-lucide-search"
              placeholder="Search..."
              size="sm"
            />
            <USelectMenu
              v-model="campaignFilter"
              :items="campaignOptions"
              value-key="value"
              size="xs"
            />
            <div class="flex gap-1">
              <USelectMenu
                v-model="folderFilter"
                :items="folderOptions"
                value-key="value"
                size="xs"
                class="flex-1"
              />
              <USelectMenu
                v-model="statusFilter"
                :items="statusOptions"
                value-key="value"
                size="xs"
                class="flex-1"
              />
            </div>
            <div class="flex items-center justify-between">
              <label class="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  v-model="showArchived"
                  type="checkbox"
                  class="rounded border-default"
                />
                Show Archived
              </label>
            </div>
          </div>

          <!-- Email List -->
          <div class="flex-1 overflow-y-auto">
            <div v-if="isFetching" class="flex items-center justify-center py-8">
              <UIcon name="i-lucide-loader-2" class="w-5 h-5 animate-spin text-muted" />
            </div>

            <div v-else-if="filteredReplies.length === 0" class="p-4 text-center text-muted text-sm">
              {{ showArchived ? 'No archived replies' : 'No replies found' }}
            </div>

            <div v-else>
              <div
                v-for="reply in filteredReplies"
                :key="reply.id"
                class="p-3 border-b border-default cursor-pointer hover:bg-elevated/50 transition-colors"
                :class="{ 'bg-elevated': selectedId === reply.id }"
                @click="selectReply(reply)"
              >
                <div class="flex items-start gap-2">
                  <span
                    v-if="!reply.read"
                    class="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2">
                      <span
                        class="truncate text-sm"
                        :class="{ 'font-semibold': !reply.read }"
                      >
                        {{ reply.from_name || reply.from_email_address }}
                      </span>
                      <span class="text-xs text-muted shrink-0">
                        {{ formatDate(reply.date_received) }}
                      </span>
                    </div>
                    <div
                      class="text-sm truncate"
                      :class="reply.read ? 'text-muted' : 'font-medium'"
                    >
                      {{ truncateText(reply.subject, 30) || '(No subject)' }}
                    </div>
                    <div class="text-xs text-muted truncate mt-0.5">
                      {{ truncateText(reply.text_body, 40) }}
                    </div>
                    <div class="flex items-center gap-1 mt-1 flex-wrap">
                      <span
                        v-if="reply.campaign_id"
                        class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {{ campaignMap[reply.campaign_id] || `C${reply.campaign_id}` }}
                      </span>
                      <span
                        v-if="archivedIds.has(reply.id)"
                        class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
                      >
                        <UIcon name="i-lucide-archive" class="w-3 h-3" />
                        Archived
                      </span>
                      <span
                        v-if="repliedToIds.has(reply.id)"
                        class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                      >
                        <UIcon name="i-lucide-reply" class="w-3 h-3" />
                        Replied
                      </span>
                      <span
                        v-if="reply.interested || reply.automated_reply"
                        class="inline-flex items-center px-1.5 py-0.5 rounded text-xs"
                        :class="{
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': reply.interested,
                          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': reply.automated_reply
                        }"
                      >
                        {{ reply.interested ? 'Interested' : 'Automated' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-2 border-t border-default text-xs text-muted text-center">
            {{ filteredReplies.length }} {{ showArchived ? 'archived' : 'replies' }}
          </div>
        </div>

        <!-- Right: Thread View -->
        <div class="flex-1 flex flex-col overflow-hidden">
          <div v-if="!selectedId" class="flex-1 flex items-center justify-center text-muted">
            Select an email to view
          </div>

          <div v-else-if="isLoadingThread" class="flex-1 flex items-center justify-center">
            <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-muted" />
          </div>

          <template v-else-if="threadData">
            <!-- Thread Header -->
            <div class="p-4 border-b border-default flex items-center justify-between">
              <div>
                <h2 class="font-semibold">{{ threadData.current_reply.subject }}</h2>
                <div class="text-sm text-muted">
                  {{ threadData.current_reply.from_name || threadData.current_reply.from_email_address }}
                </div>
              </div>
              <div class="flex items-center gap-2">
                <UButton
                  v-if="!threadData.current_reply.interested"
                  icon="i-lucide-star"
                  color="primary"
                  variant="soft"
                  size="sm"
                  :loading="updatingIds.has(threadData.current_reply.id)"
                  @click="markAsInterested(threadData!.current_reply)"
                >
                  Interested
                </UButton>
                <span
                  v-else
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                >
                  Interested
                </span>
                <UButton
                  :icon="archivedIds.has(threadData.current_reply.id) ? 'i-lucide-archive-restore' : 'i-lucide-archive'"
                  color="neutral"
                  variant="soft"
                  size="sm"
                  @click="archivedIds.has(threadData!.current_reply.id) ? unarchiveReply(threadData!.current_reply.id) : archiveReply(threadData!.current_reply.id)"
                >
                  {{ archivedIds.has(threadData.current_reply.id) ? 'Unarchive' : 'Archive' }}
                </UButton>
              </div>
            </div>

            <!-- Thread Messages -->
            <div class="flex-1 overflow-y-auto p-4 space-y-4">
              <div
                v-for="message in allMessages"
                :key="message.id"
                class="bg-elevated rounded-lg p-4 border border-default"
                :class="{ 'ring-2 ring-primary': message.id === threadData.current_reply.id }"
              >
                <div class="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div class="font-medium">
                      {{ message.from_name || message.from_email_address }}
                    </div>
                    <div class="text-sm text-muted">
                      {{ message.from_email_address }}
                    </div>
                    <div class="text-xs text-muted mt-1">
                      To: {{ message.to?.map(t => t.address).join(', ') || message.primary_to_email_address }}
                    </div>
                  </div>
                  <div class="text-sm text-muted whitespace-nowrap">
                    {{ formatDateLong(message.date_received) }}
                  </div>
                </div>

                <div class="border-t border-default pt-3">
                  <div
                    v-if="message.html_body"
                    class="prose prose-sm dark:prose-invert max-w-none"
                    v-html="message.html_body"
                  />
                  <pre v-else class="whitespace-pre-wrap text-sm font-sans">{{ message.text_body }}</pre>
                </div>

                <div v-if="message.attachments?.length" class="mt-3 pt-3 border-t border-default">
                  <div class="text-xs text-muted mb-2">Attachments:</div>
                  <div class="flex flex-wrap gap-2">
                    <a
                      v-for="attachment in message.attachments"
                      :key="attachment.id"
                      :href="attachment.download_url"
                      target="_blank"
                      class="inline-flex items-center gap-1 px-2 py-1 bg-default rounded text-xs hover:bg-muted"
                    >
                      <UIcon name="i-lucide-paperclip" class="w-3 h-3" />
                      {{ attachment.file_name }}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <div v-else class="flex-1 flex items-center justify-center text-muted">
            Failed to load thread
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
