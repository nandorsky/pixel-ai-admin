<script setup lang="ts">
definePageMeta({ layout: false })

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

interface ReplyTemplate {
  id: number
  name: string
  body: string
}

interface Campaign {
  id: number
  name: string
  status: string
}

const toast = useToast()

const replies = ref<Reply[]>([])
const isFetching = ref(true)
const currentIndex = ref(0)
const actionInProgress = ref<'archive' | 'waitlist' | null>(null)
const replyTemplates = ref<ReplyTemplate[]>([])
const campaigns = ref<Campaign[]>([])
const archivedIds = ref<Set<number>>(new Set())
const processedIds = ref<Set<number>>(new Set())
const showBody = ref(false)

const campaignMap = computed(() => {
  const map: Record<number, string> = {}
  campaigns.value.forEach(c => map[c.id] = c.name)
  return map
})

// Only show non-automated, non-archived, inbox replies that haven't been processed
const queue = computed(() => {
  return replies.value.filter(r =>
    !r.automated_reply &&
    r.folder?.toLowerCase() !== 'sent' &&
    !archivedIds.value.has(r.id) &&
    !processedIds.value.has(r.id)
  )
})

const currentReply = computed(() => queue.value[currentIndex.value] || null)
const remaining = computed(() => queue.value.length - currentIndex.value)

function loadArchivedIds() {
  try {
    const stored = localStorage.getItem('inbox-archived-ids')
    if (stored) archivedIds.value = new Set(JSON.parse(stored))
  } catch {}
}

function saveArchivedIds() {
  localStorage.setItem('inbox-archived-ids', JSON.stringify([...archivedIds.value]))
}

async function fetchCampaigns() {
  try {
    const response = await $fetch('/api/email-bison/campaigns')
    campaigns.value = (response as any)?.data || response || []
  } catch {}
}

async function fetchReplyTemplates() {
  try {
    const response = await $fetch('/api/email-bison/reply-templates')
    replyTemplates.value = (response as any)?.data || response || []
  } catch {}
}

async function fetchReplies() {
  isFetching.value = true

  try {
    const allReplies: Reply[] = []
    let lastMeta: any = null

    for (let i = 0; i < 7; i++) {
      const params: Record<string, string> = {
        page: String(i + 1),
        per_page: '15',
        folder: 'inbox'
      }

      const response = await $fetch('/api/email-bison/replies', { params })
      const pageReplies = (response as any)?.data || []
      lastMeta = (response as any)?.meta
      allReplies.push(...pageReplies)

      if (!lastMeta || (i + 1) >= lastMeta.last_page) break
    }

    replies.value = allReplies
  } catch (error: any) {
    toast.add({ title: 'Error loading inbox', description: error.message, color: 'error' })
  }

  isFetching.value = false
}

async function archive() {
  const reply = currentReply.value
  if (!reply || actionInProgress.value) return

  actionInProgress.value = 'archive'
  try {
    archivedIds.value.add(reply.id)
    saveArchivedIds()
    processedIds.value.add(reply.id)
    toast.add({ title: 'Archived', color: 'success' })
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  }
  actionInProgress.value = null
  showBody.value = false
}

async function addToWaitlistAndReply() {
  const reply = currentReply.value
  if (!reply || actionInProgress.value) return

  actionInProgress.value = 'waitlist'
  try {
    // 1. Send templated reply
    const template = replyTemplates.value[0]
    if (template) {
      await $fetch(`/api/email-bison/replies/${reply.id}/send-reply`, {
        method: 'POST',
        body: {
          message: template.body,
          inject_previous_email_body: true,
          content_type: 'html'
        }
      })
    }

    // 2. Add to waitlist
    const nameParts = (reply.from_name || '').trim().split(/\s+/)
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    const result = await $fetch('/api/waitlist/signup', {
      method: 'POST',
      body: { email: reply.from_email_address, firstName, lastName }
    })

    // 3. Mark as interested
    await $fetch(`/api/email-bison/replies/${reply.id}/mark-interested`, { method: 'PATCH' })
    reply.interested = true

    const already = (result as any)?.alreadySignedUp
    processedIds.value.add(reply.id)
    toast.add({
      title: already ? 'Already on waitlist' : 'Waitlisted & replied!',
      color: 'success'
    })
  } catch (error: any) {
    toast.add({ title: 'Error', description: error.message, color: 'error' })
  }
  actionInProgress.value = null
  showBody.value = false
}

function skip() {
  if (currentIndex.value < queue.value.length - 1) {
    currentIndex.value++
    showBody.value = false
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  loadArchivedIds()
  await Promise.all([fetchCampaigns(), fetchReplyTemplates()])
  await fetchReplies()
})
</script>

<template>
  <div class="min-h-dvh bg-default flex flex-col">
    <!-- Header -->
    <div class="sticky top-0 z-10 bg-elevated border-b border-default px-4 py-3 flex items-center justify-between">
      <NuxtLink to="/inbox" class="text-sm text-muted">
        &larr; Desktop
      </NuxtLink>
      <span class="text-sm font-semibold">Inbox</span>
      <span class="text-xs text-muted">{{ remaining }} left</span>
    </div>

    <!-- Loading -->
    <div v-if="isFetching" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p class="text-sm text-muted">Loading inbox...</p>
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="!currentReply" class="flex-1 flex items-center justify-center p-6">
      <div class="text-center">
        <div class="text-4xl mb-3">&#10003;</div>
        <p class="text-lg font-semibold mb-1">All caught up!</p>
        <p class="text-sm text-muted">No more emails to review.</p>
      </div>
    </div>

    <!-- Card -->
    <template v-else>
      <div class="flex-1 overflow-y-auto p-4">
        <div class="bg-elevated rounded-xl border border-default shadow-sm">
          <!-- Sender info -->
          <div class="p-4 border-b border-default">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="font-semibold text-base truncate">
                  {{ currentReply.from_name || currentReply.from_email_address }}
                </p>
                <p class="text-xs text-muted truncate mt-0.5">
                  {{ currentReply.from_email_address }}
                </p>
              </div>
              <div class="shrink-0 text-right">
                <p class="text-xs text-muted">{{ formatDate(currentReply.date_received) }}</p>
                <div class="flex items-center gap-1 mt-1 justify-end">
                  <span
                    v-if="currentReply.campaign_id"
                    class="inline-block px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {{ campaignMap[currentReply.campaign_id] || `C${currentReply.campaign_id}` }}
                  </span>
                  <span
                    v-if="currentReply.interested"
                    class="inline-block px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  >
                    Interested
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Subject -->
          <div class="px-4 py-3 border-b border-default">
            <p class="text-sm font-medium">{{ currentReply.subject || '(no subject)' }}</p>
          </div>

          <!-- Body preview / full -->
          <div class="p-4">
            <div v-if="!showBody" class="space-y-2">
              <p class="text-sm leading-relaxed whitespace-pre-line">{{ currentReply.text_body?.slice(0, 200) || '(no body)' }}<span v-if="(currentReply.text_body?.length || 0) > 200">...</span></p>
              <button
                v-if="(currentReply.text_body?.length || 0) > 200 || currentReply.html_body"
                class="text-xs text-primary font-medium"
                @click="showBody = true"
              >
                Show full email
              </button>
            </div>
            <div v-else class="space-y-2">
              <div
                v-if="currentReply.html_body"
                class="prose prose-sm dark:prose-invert max-w-none text-sm"
                v-html="currentReply.html_body"
              />
              <pre v-else class="whitespace-pre-wrap text-sm font-sans leading-relaxed">{{ currentReply.text_body }}</pre>
              <button class="text-xs text-primary font-medium" @click="showBody = false">
                Collapse
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Action buttons - fixed at bottom -->
      <div class="sticky bottom-0 bg-elevated border-t border-default p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div class="flex gap-3">
          <button
            class="flex-1 py-4 rounded-xl text-base font-semibold transition-all active:scale-95 border-2 border-default bg-default text-muted"
            :class="{ 'opacity-50': actionInProgress }"
            :disabled="!!actionInProgress"
            @click="archive"
          >
            <template v-if="actionInProgress === 'archive'">
              <span class="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin align-middle mr-1" />
            </template>
            <template v-else>
              Archive
            </template>
          </button>
          <button
            class="flex-1 py-4 rounded-xl text-base font-semibold transition-all active:scale-95 text-white"
            :class="[
              currentReply.interested
                ? 'bg-green-600 opacity-60 cursor-not-allowed'
                : 'bg-primary active:bg-primary/80',
              { 'opacity-50': actionInProgress }
            ]"
            :disabled="!!actionInProgress || currentReply.interested"
            @click="addToWaitlistAndReply"
          >
            <template v-if="actionInProgress === 'waitlist'">
              <span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin align-middle mr-1" />
              Sending...
            </template>
            <template v-else-if="currentReply.interested">
              Already Interested
            </template>
            <template v-else>
              + Waitlist
            </template>
          </button>
        </div>
        <button
          class="w-full mt-2 py-2 text-sm text-muted font-medium"
          :disabled="!!actionInProgress"
          @click="skip"
        >
          Skip &rarr;
        </button>
      </div>
    </template>
  </div>
</template>
