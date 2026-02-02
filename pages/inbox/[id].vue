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
  attachments: { id: number; file_name: string; download_url: string }[]
}

interface ThreadData {
  current_reply: Reply
  older_messages: Reply[]
  newer_messages: Reply[]
}

const route = useRoute()
const toast = useToast()

const threadData = ref<ThreadData | null>(null)
const isLoading = ref(true)
const isUpdating = ref(false)

const allMessages = computed(() => {
  if (!threadData.value) return []
  const { older_messages, current_reply, newer_messages } = threadData.value
  const all = [
    ...(older_messages || []),
    current_reply,
    ...(newer_messages || [])
  ]
  // Deduplicate by ID
  const seen = new Set<number>()
  const unique = all.filter(msg => {
    if (seen.has(msg.id)) return false
    seen.add(msg.id)
    return true
  })
  return unique.sort((a, b) => new Date(b.date_received).getTime() - new Date(a.date_received).getTime())
})

async function fetchThread() {
  isLoading.value = true
  try {
    const response = await $fetch(`/api/email-bison/replies/${route.params.id}/thread`)
    threadData.value = (response as any)?.data || response
  } catch (error: any) {
    toast.add({
      title: 'Error loading thread',
      description: error.message || 'Failed to load email thread',
      color: 'error'
    })
  }
  isLoading.value = false
}

onMounted(() => {
  fetchThread()
})

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function markAsInterested() {
  isUpdating.value = true
  try {
    await $fetch(`/api/email-bison/replies/${route.params.id}/mark-interested`, { method: 'PATCH' })
    if (threadData.value?.current_reply) {
      threadData.value.current_reply.interested = true
    }
    toast.add({
      title: 'Marked as interested',
      color: 'success'
    })
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to mark as interested',
      color: 'error'
    })
  }
  isUpdating.value = false
}

async function markAsNotInterested() {
  isUpdating.value = true
  try {
    await $fetch(`/api/email-bison/replies/${route.params.id}/mark-not-interested`, { method: 'PATCH' })
    if (threadData.value?.current_reply) {
      threadData.value.current_reply.interested = false
    }
    toast.add({
      title: 'Marked as not interested',
      color: 'success'
    })
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.message || 'Failed to mark as not interested',
      color: 'error'
    })
  }
  isUpdating.value = false
}
</script>

<template>
  <UDashboardPanel id="inbox-detail">
    <template #header>
      <UDashboardNavbar :title="threadData?.current_reply?.subject || 'Email Thread'">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            to="/inbox"
          />
        </template>
        <template #right>
          <div v-if="threadData?.current_reply" class="flex items-center gap-2">
            <span
              v-if="threadData.current_reply.interested"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            >
              Interested
            </span>
            <span
              v-else-if="threadData.current_reply.automated_reply"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            >
              Automated
            </span>

            <UButton
              v-if="!threadData.current_reply.interested"
              icon="i-lucide-thumbs-up"
              color="primary"
              variant="soft"
              size="sm"
              :loading="isUpdating"
              @click="markAsInterested"
            >
              Interested
            </UButton>
            <UButton
              v-if="threadData.current_reply.interested"
              icon="i-lucide-thumbs-down"
              color="neutral"
              variant="soft"
              size="sm"
              :loading="isUpdating"
              @click="markAsNotInterested"
            >
              Not Interested
            </UButton>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-muted" />
      </div>

      <div v-else-if="threadData" class="max-w-4xl mx-auto space-y-4">
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
              {{ formatDate(message.date_received) }}
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

      <div v-else class="flex items-center justify-center py-12 text-muted">
        No thread data found
      </div>
    </template>
  </UDashboardPanel>
</template>
