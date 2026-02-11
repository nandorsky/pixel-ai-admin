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
  parent_id: number | null
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

interface ReplyTemplate {
  id: number
  name: string
  body: string
}

const toast = useToast()

// List state
const replies = ref<Reply[]>([])
const isFetching = ref(true)
const isLoadingMore = ref(false)
const currentPage = ref(1)
const hasMorePages = ref(true)
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

// Multi-select
const selectedIds = ref<Set<number>>(new Set())
const isSelectionMode = computed(() => selectedIds.value.size > 0)

function toggleSelect(replyId: number, event: Event) {
  event.stopPropagation()
  if (selectedIds.value.has(replyId)) {
    selectedIds.value.delete(replyId)
  } else {
    selectedIds.value.add(replyId)
  }
  selectedIds.value = new Set(selectedIds.value) // trigger reactivity
}

function selectAll() {
  filteredReplies.value.forEach(r => selectedIds.value.add(r.id))
  selectedIds.value = new Set(selectedIds.value)
}

function clearSelection() {
  selectedIds.value = new Set()
}

async function bulkMarkInterested() {
  const ids = [...selectedIds.value]
  for (const id of ids) {
    updatingIds.value.add(id)
  }

  try {
    await Promise.all(ids.map(id =>
      $fetch(`/api/email-bison/replies/${id}/mark-interested`, { method: 'PATCH' })
    ))
    // Update local state
    replies.value.forEach(r => {
      if (selectedIds.value.has(r.id)) {
        r.interested = true
      }
    })
    toast.add({ title: `Marked ${ids.length} as interested`, color: 'success' })
    clearSelection()
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  }

  ids.forEach(id => updatingIds.value.delete(id))
}

function bulkArchive() {
  const ids = [...selectedIds.value]
  ids.forEach(id => archivedIds.value.add(id))
  saveArchivedIds()
  toast.add({ title: `Archived ${ids.length} emails`, color: 'success' })
  clearSelection()
}

// Reply/Compose
const replyTemplates = ref<ReplyTemplate[]>([])
const showCompose = ref(false)
const selectedTemplateId = ref<number | null>(null)
const composeMessage = ref('')
const isSendingReply = ref(false)
const addToWaitlist = ref(false)

const selectedTemplate = computed(() => {
  if (!selectedTemplateId.value) return null
  return replyTemplates.value.find(t => t.id === selectedTemplateId.value)
})

const templateOptions = computed(() => [
  { label: 'No template', value: '' },
  ...replyTemplates.value.map(t => ({ label: t.name, value: String(t.id) }))
])

async function fetchReplyTemplates() {
  try {
    const response = await $fetch('/api/email-bison/reply-templates')
    replyTemplates.value = (response as any)?.data || response || []
  } catch (error: any) {
    console.error('Failed to fetch reply templates:', error)
  }
}

function openCompose() {
  showCompose.value = true
  selectedTemplateId.value = null
  composeMessage.value = ''
}

function closeCompose() {
  showCompose.value = false
  selectedTemplateId.value = null
  composeMessage.value = ''
  addToWaitlist.value = false
}

function onTemplateSelect(value: string) {
  selectedTemplateId.value = value ? Number(value) : null
  if (selectedTemplate.value) {
    // Convert HTML to plain text, preserving line breaks
    let html = selectedTemplate.value.body
    // Replace block elements and br with newlines
    html = html.replace(/<br\s*\/?>/gi, '\n')
    html = html.replace(/<\/p>/gi, '\n')
    html = html.replace(/<\/div>/gi, '\n')
    html = html.replace(/<\/li>/gi, '\n')
    // Extract text content
    const temp = document.createElement('div')
    temp.innerHTML = html
    // Clean up multiple newlines and trim
    composeMessage.value = (temp.textContent || temp.innerText || '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  } else {
    composeMessage.value = ''
  }
}

async function sendReply() {
  if (!threadData.value || !composeMessage.value.trim()) return

  isSendingReply.value = true
  try {
    // Convert newlines to <br> tags for HTML email rendering
    const htmlMessage = composeMessage.value.replace(/\n/g, '<br>')

    await $fetch(`/api/email-bison/replies/${threadData.value.current_reply.id}/send-reply`, {
      method: 'POST',
      body: {
        message: htmlMessage,
        reply_template_id: selectedTemplateId.value,
        inject_previous_email_body: true,
        content_type: 'html'
      }
    })

    // Add to waitlist if checkbox is checked
    if (addToWaitlist.value) {
      const reply = threadData.value.current_reply
      const email = reply.from_email_address
      // Parse first and last name from from_name
      const nameParts = (reply.from_name || '').trim().split(/\s+/)
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      try {
        const result = await $fetch('/api/waitlist/signup', {
          method: 'POST',
          body: {
            email,
            firstName,
            lastName
          }
        })
        if ((result as any)?.alreadySignedUp) {
          toast.add({ title: 'Already on waitlist', color: 'neutral' })
        } else {
          toast.add({ title: 'Added to waitlist!', color: 'success' })
        }
      } catch (waitlistError: any) {
        console.error('Failed to add to waitlist:', waitlistError)
        const errorMsg = waitlistError?.data?.statusMessage || waitlistError?.message || ''
        toast.add({ title: 'Failed to add to waitlist', description: errorMsg, color: 'warning' })
      }
    }

    toast.add({ title: 'Reply sent!', color: 'success' })
    closeCompose()
    // Mark as replied locally
    repliedToIds.value.add(threadData.value.current_reply.id)
    // Refresh thread to show sent message
    selectReply(threadData.value.current_reply)
  } catch (error: any) {
    toast.add({ title: 'Error sending reply', description: error.message, color: 'error' })
  }
  isSendingReply.value = false
}

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
  let filtered = replies.value

  // Apply status filter client-side
  if (statusFilter.value === 'not_automated_reply') {
    filtered = filtered.filter(r => !r.automated_reply)
  } else if (statusFilter.value === 'automated_reply') {
    filtered = filtered.filter(r => r.automated_reply)
  } else if (statusFilter.value === 'interested') {
    filtered = filtered.filter(r => r.interested)
  }

  // Apply archive filter
  if (showArchived.value) {
    return filtered.filter(r => archivedIds.value.has(r.id))
  }
  return filtered.filter(r => !archivedIds.value.has(r.id))
})

const statusOptions = [
  { label: 'All', value: '' },
  { label: 'Interested', value: 'interested' },
  { label: 'Automated Reply', value: 'automated_reply' },
  { label: 'Not Automated', value: 'not_automated_reply' }
]

// Track which messages have been replied to (by checking sent messages' parent_ids)
const repliedMessageIds = computed(() => {
  const ids = new Set<number>()
  replies.value.forEach(r => {
    if (r.folder?.toLowerCase() === 'sent' && r.parent_id) {
      ids.add(r.parent_id)
    }
  })
  repliedToIds.value.forEach(id => ids.add(id))
  return ids
})

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

async function fetchReplies(loadMore = false) {
  if (loadMore) {
    isLoadingMore.value = true
  } else {
    isFetching.value = true
    currentPage.value = 1
    replies.value = []
  }

  const buildParams = (page: number) => {
    const params: Record<string, string> = {
      page: String(page),
      per_page: '15'
    }
    if (searchQuery.value) params.search = searchQuery.value
    // Don't send status filter to API - we'll filter client-side
    if (folderFilter.value && folderFilter.value !== 'all') params.folder = folderFilter.value
    if (campaignFilter.value) params.campaign_id = campaignFilter.value
    return params
  }

  try {
    // On initial load, fetch multiple pages to get ~100 messages
    const pagesToFetch = loadMore ? 1 : 7  // 7 pages * ~15 = ~105 messages
    const allNewReplies: any[] = []
    let lastMeta: any = null

    for (let i = 0; i < pagesToFetch; i++) {
      const pageNum = loadMore ? currentPage.value : i + 1
      const params = buildParams(pageNum)

      const repliesResponse = await $fetch('/api/email-bison/replies', { params })
      const pageReplies = (repliesResponse as any)?.data || []
      lastMeta = (repliesResponse as any)?.meta

      allNewReplies.push(...pageReplies)

      // Stop if no more pages
      if (!lastMeta || pageNum >= lastMeta.last_page) break
    }

    // Fetch sent messages for replied tracking
    const sentParams = buildParams(1)
    sentParams.folder = 'sent'
    const sentResponse = await $fetch('/api/email-bison/replies', { params: sentParams })


    if (loadMore) {
      replies.value = [...replies.value, ...allNewReplies]
      currentPage.value++
    } else {
      replies.value = allNewReplies
      currentPage.value = pagesToFetch
    }

    // Check if there are more pages using API meta
    hasMorePages.value = lastMeta ? currentPage.value < lastMeta.last_page : false

    // Build set of parent IDs from sent messages (these are messages we've replied to)
    const sentMessages = (sentResponse as any)?.data || sentResponse || []
    const newRepliedIds = sentMessages
      .filter((msg: any) => msg.parent_id)
      .map((msg: any) => msg.parent_id)

    if (loadMore) {
      newRepliedIds.forEach((id: number) => repliedToIds.value.add(id))
    } else {
      repliedToIds.value = new Set(newRepliedIds)
    }
  } catch (error: any) {
    toast.add({
      title: 'Error fetching replies',
      description: error.message || 'Failed to load inbox',
      color: 'error'
    })
    if (!loadMore) {
      replies.value = []
    }
  }

  isFetching.value = false
  isLoadingMore.value = false
}

function loadMore() {
  currentPage.value++
  fetchReplies(true)
}

async function selectReply(reply: Reply) {
  selectedId.value = reply.id
  isLoadingThread.value = true
  threadData.value = null

  try {
    const response = await $fetch(`/api/email-bison/replies/${reply.id}/thread`)
    threadData.value = (response as any)?.data || response

    // Mark as read if unread
    if (!reply.read) {
      await $fetch(`/api/email-bison/replies/${reply.id}/mark-read`, {
        method: 'PATCH',
        body: { read: true }
      })
      reply.read = true
    }
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
  fetchReplyTemplates()
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

watch([folderFilter, campaignFilter], () => {
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
    // Also update the replies list
    const listReply = replies.value.find(r => r.id === reply.id)
    if (listReply) listReply.interested = true
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
    // Also update the replies list
    const listReply = replies.value.find(r => r.id === reply.id)
    if (listReply) listReply.interested = false
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
        <template #right>
          <div class="flex items-center gap-2">
            <UInput
              :model-value="searchQuery"
              @update:model-value="onSearch"
              icon="i-lucide-search"
              placeholder="Search..."
              size="sm"
              class="w-48"
            />
            <USelectMenu
              v-model="campaignFilter"
              :items="campaignOptions"
              value-key="value"
              size="sm"
              class="w-36"
            />
            <USelectMenu
              v-model="folderFilter"
              :items="folderOptions"
              value-key="value"
              size="sm"
              class="w-24"
            />
            <USelectMenu
              v-model="statusFilter"
              :items="statusOptions"
              value-key="value"
              size="sm"
              class="w-32"
            />
            <label class="flex items-center gap-1.5 text-sm cursor-pointer whitespace-nowrap">
              <input
                v-model="showArchived"
                type="checkbox"
                class="rounded border-default"
              />
              Archived
            </label>
            <NuxtLink to="/inbox/mobile">
              <UButton
                icon="i-lucide-smartphone"
                size="sm"
                color="neutral"
                variant="ghost"
              />
            </NuxtLink>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex h-full gap-0 -m-4">
        <!-- Left: Email List -->
        <div class="w-80 shrink-0 border-r border-default flex flex-col">

          <!-- Bulk Actions -->
          <div v-if="isSelectionMode" class="p-2 border-b border-default bg-elevated flex items-center gap-2">
            <span class="text-xs text-muted">{{ selectedIds.size }} selected</span>
            <UButton size="xs" color="primary" variant="soft" @click="bulkMarkInterested">
              Interested
            </UButton>
            <UButton size="xs" color="neutral" variant="soft" @click="bulkArchive">
              Archive
            </UButton>
            <UButton size="xs" color="neutral" variant="ghost" @click="clearSelection">
              Cancel
            </UButton>
          </div>

          <!-- Select All -->
          <div v-if="!isSelectionMode && filteredReplies.length > 0" class="px-3 py-1 border-b border-default">
            <button class="text-xs text-blue-600 dark:text-blue-400 hover:underline" @click="selectAll">
              Select All
            </button>
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
                class="group p-3 border-b border-default cursor-pointer hover:bg-elevated/50 transition-colors"
                :class="{ 'bg-elevated': selectedId === reply.id, 'bg-blue-50 dark:bg-blue-950': selectedIds.has(reply.id) }"
                @click="selectReply(reply)"
              >
                <div class="flex items-start gap-2">
                  <input
                    type="checkbox"
                    :checked="selectedIds.has(reply.id)"
                    class="w-4 h-4 rounded border-default shrink-0 mt-0.5 cursor-pointer"
                    @click="toggleSelect(reply.id, $event)"
                  />
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
                      <div class="flex items-center gap-1.5 shrink-0">
                        <span
                          v-if="repliedToIds.has(reply.id)"
                          class="inline-flex items-center gap-0.5 text-xs text-muted"
                          title="Messages in thread"
                        >
                          <UIcon name="i-lucide-messages-square" class="w-3 h-3" />
                          2
                        </span>
                        <span class="text-xs text-muted">
                          {{ formatDate(reply.date_received) }}
                        </span>
                      </div>
                    </div>
                    <div class="text-xs text-muted truncate mt-0.5">
                      {{ truncateText(reply.text_body, 50) }}
                    </div>
                    <div class="flex items-center gap-1 mt-1 flex-wrap">
                      <span
                        v-if="reply.campaign_id"
                        class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {{ campaignMap[reply.campaign_id] || `C${reply.campaign_id}` }}
                      </span>
                      <span
                        v-if="repliedMessageIds.has(reply.id)"
                        class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                      >
                        <UIcon name="i-lucide-reply" class="w-3 h-3" />
                        Replied
                      </span>
                      <span
                        v-if="archivedIds.has(reply.id)"
                        class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
                      >
                        <UIcon name="i-lucide-archive" class="w-3 h-3" />
                        Archived
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
                    <!-- Action buttons on hover -->
                    <div class="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <UButton
                        v-if="!reply.interested"
                        icon="i-lucide-star"
                        size="xs"
                        color="primary"
                        variant="soft"
                        :loading="updatingIds.has(reply.id)"
                        @click.stop="markAsInterested(reply)"
                      >
                        Interested
                      </UButton>
                      <UButton
                        v-if="!archivedIds.has(reply.id)"
                        icon="i-lucide-archive"
                        size="xs"
                        color="neutral"
                        variant="soft"
                        @click.stop="archiveReply(reply.id)"
                      >
                        Archive
                      </UButton>
                      <UButton
                        v-else
                        icon="i-lucide-archive-restore"
                        size="xs"
                        color="neutral"
                        variant="soft"
                        @click.stop="unarchiveReply(reply.id)"
                      >
                        Unarchive
                      </UButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-2 border-t border-default space-y-2">
            <div v-if="hasMorePages && !showArchived" class="flex justify-center">
              <UButton
                size="xs"
                color="neutral"
                variant="soft"
                :loading="isLoadingMore"
                @click="loadMore"
              >
                Load More
              </UButton>
            </div>
            <div class="text-xs text-muted text-center">
              {{ filteredReplies.length }} {{ showArchived ? 'archived' : 'replies' }}
            </div>
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
                  icon="i-lucide-reply"
                  color="primary"
                  size="sm"
                  @click="openCompose"
                >
                  Reply
                </UButton>
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

  <!-- Compose Modal -->
  <Teleport to="body">
    <div
      v-if="showCompose"
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/50"
        @click="closeCompose"
      />

      <!-- Modal Content -->
      <div class="relative bg-default border border-default rounded-lg shadow-xl w-[600px] max-w-[90vw] max-h-[90vh] overflow-hidden">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">Reply</h3>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="closeCompose"
            />
          </div>

          <div v-if="threadData" class="text-sm text-muted mb-4">
            To: {{ threadData.current_reply.from_name || threadData.current_reply.from_email_address }}
            <span class="text-xs">({{ threadData.current_reply.from_email_address }})</span>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1">Template</label>
              <select
                class="w-full px-3 py-2 border border-default rounded-md bg-elevated text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                :value="selectedTemplateId || ''"
                @change="onTemplateSelect(($event.target as HTMLSelectElement).value)"
              >
                <option value="">Select a template (optional)</option>
                <option
                  v-for="template in replyTemplates"
                  :key="template.id"
                  :value="template.id"
                >
                  {{ template.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1">Message</label>
              <textarea
                v-model="composeMessage"
                class="w-full min-h-[200px] max-h-[400px] p-3 border border-default rounded-md bg-elevated focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-y"
                placeholder="Type your reply..."
              />
            </div>

            <div class="flex items-center justify-between gap-2 pt-2">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="addToWaitlist"
                  type="checkbox"
                  class="w-4 h-4 rounded border-default"
                />
                <span class="text-sm">Add to waitlist</span>
              </label>
              <div class="flex items-center gap-2">
              <UButton
                color="neutral"
                variant="ghost"
                @click="closeCompose"
              >
                Cancel
              </UButton>
              <UButton
                icon="i-lucide-send"
                color="primary"
                :loading="isSendingReply"
                :disabled="!composeMessage.trim()"
                @click="sendReply"
              >
                Send Reply
              </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
