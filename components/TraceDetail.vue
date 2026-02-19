<script setup lang="ts">
interface ParsedMessage {
  type: 'human' | 'ai' | 'tool'
  content: string
  toolCalls?: { name: string; args: Record<string, any> }[]
  toolName?: string
  toolStatus?: string
  model?: string
}

const props = defineProps<{
  trace: any
  tabs?: string[]
  defaultTab?: string
}>()

const availableTabs = computed(() => props.tabs || ['creative', 'conversation', 'metadata'])
const activeTab = ref(props.defaultTab || availableTabs.value[0])
const expandedSteps = ref<Set<number>>(new Set())

watch(() => props.trace, () => {
  activeTab.value = props.defaultTab || availableTabs.value[0]
  expandedSteps.value = new Set()
})

function getOutputMessages(trace: any): ParsedMessage[] {
  if (!trace?.output?.messages?.length) return []
  const messages: ParsedMessage[] = []

  for (const msg of trace.output.messages) {
    if (msg.type === 'human') {
      messages.push({ type: 'human', content: msg.content })
    } else if (msg.type === 'ai') {
      let text = ''
      const toolCalls: { name: string; args: Record<string, any> }[] = []

      if (typeof msg.content === 'string') {
        text = msg.content
      } else if (Array.isArray(msg.content)) {
        for (const block of msg.content) {
          if (block.type === 'text' && block.text) {
            text += block.text + '\n'
          }
        }
      }

      if (msg.tool_calls?.length) {
        for (const tc of msg.tool_calls) {
          toolCalls.push({ name: tc.name, args: tc.args || {} })
        }
      }

      messages.push({
        type: 'ai',
        content: text.trim(),
        toolCalls: toolCalls.length ? toolCalls : undefined,
        model: msg.response_metadata?.model_name
      })
    } else if (msg.type === 'tool') {
      let content = msg.content || ''
      if (content.length > 500) {
        content = content.substring(0, 500) + '...'
      }
      messages.push({
        type: 'tool',
        content,
        toolName: msg.name,
        toolStatus: msg.status
      })
    }
  }

  return messages
}

function getImageUrls(trace: any): string[] {
  if (!trace?.output?.messages?.length) return []
  const urls: string[] = []
  const pngRegex = /https?:\/\/[^\s"']+\.png/gi

  for (const msg of trace.output.messages) {
    const content = msg.content || ''
    const text = typeof content === 'string' ? content : JSON.stringify(content)
    const matches = text.match(pngRegex)
    if (matches) {
      for (const url of matches) {
        if (!urls.includes(url)) urls.push(url)
      }
    }
  }

  return urls
}

function formatJson(obj: any): string {
  if (!obj) return '—'
  if (typeof obj === 'string') return obj
  return JSON.stringify(obj, null, 2)
}
</script>

<template>
  <div v-if="trace" class="space-y-4">
    <!-- Tabs -->
    <div class="flex items-center gap-4 border-b border-default">
      <button
        v-for="tab in availableTabs"
        :key="tab"
        class="pb-2 text-sm font-medium border-b-2 transition-colors capitalize"
        :class="activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-default'"
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <!-- Creative view -->
    <div v-if="activeTab === 'creative'" class="space-y-4">
      <div v-if="getImageUrls(trace).length" class="grid grid-cols-4 gap-3">
        <a
          v-for="(url, idx) in getImageUrls(trace)"
          :key="idx"
          :href="url"
          target="_blank"
          class="block rounded-lg border border-default overflow-hidden hover:ring-2 hover:ring-primary/50 transition-shadow"
        >
          <img
            :src="url"
            :alt="`Creative ${idx + 1}`"
            class="w-full h-auto object-contain bg-neutral-50 dark:bg-neutral-900"
          />
        </a>
      </div>
      <div v-if="!getImageUrls(trace).length" class="text-sm text-muted text-center py-8">
        No creative content
      </div>
    </div>

    <!-- Conversation view -->
    <div v-else-if="activeTab === 'conversation'" class="space-y-3">
      <template v-for="(msg, idx) in getOutputMessages(trace)" :key="idx">
        <!-- Human message -->
        <div v-if="msg.type === 'human'" class="flex gap-3">
          <div class="size-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0 mt-0.5">
            <UIcon name="i-lucide-user" class="size-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-muted mb-1">User</p>
            <p class="text-sm text-highlighted whitespace-pre-wrap">{{ msg.content }}</p>
          </div>
        </div>

        <!-- AI message -->
        <div v-else-if="msg.type === 'ai'" class="flex gap-3">
          <div class="size-7 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0 mt-0.5">
            <UIcon name="i-lucide-bot" class="size-4 text-green-600 dark:text-green-400" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-muted mb-1">
              AI
              <span v-if="msg.model" class="font-normal text-dimmed ml-1">{{ msg.model }}</span>
            </p>
            <p v-if="msg.content" class="text-sm text-highlighted whitespace-pre-wrap">{{ msg.content }}</p>
            <div v-if="msg.toolCalls?.length" class="mt-2">
              <button
                class="flex items-center gap-1.5 text-xs text-muted hover:text-default transition-colors"
                @click.stop="expandedSteps.has(idx) ? expandedSteps.delete(idx) : expandedSteps.add(idx)"
              >
                <UIcon
                  :name="expandedSteps.has(idx) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                  class="size-3.5"
                />
                <span class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-wrench" class="size-3 text-amber-600 dark:text-amber-400" />
                  {{ msg.toolCalls.map(tc => tc.name).join(', ') }}
                </span>
              </button>
              <div v-if="expandedSteps.has(idx)" class="mt-2 space-y-2">
                <div
                  v-for="(tc, tcIdx) in msg.toolCalls"
                  :key="tcIdx"
                  class="rounded border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/50 p-2"
                >
                  <p class="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">{{ tc.name }}</p>
                  <pre class="text-xs text-muted whitespace-pre-wrap break-words max-h-40 overflow-auto">{{ JSON.stringify(tc.args, null, 2) }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tool response (expandable) -->
        <div v-else-if="msg.type === 'tool'" class="pl-10">
          <button
            class="flex items-center gap-1.5 text-xs text-muted hover:text-default transition-colors"
            @click.stop="expandedSteps.has(idx) ? expandedSteps.delete(idx) : expandedSteps.add(idx)"
          >
            <UIcon
              :name="expandedSteps.has(idx) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
              class="size-3.5"
            />
            <UIcon
              :name="msg.toolStatus === 'error' ? 'i-lucide-x-circle' : 'i-lucide-check-circle'"
              :class="msg.toolStatus === 'error' ? 'size-3 text-red-500' : 'size-3 text-green-500'"
            />
            <span>{{ msg.toolName }} response</span>
          </button>
          <pre
            v-if="expandedSteps.has(idx)"
            class="mt-2 text-xs bg-gray-50 dark:bg-gray-900 rounded p-2 overflow-auto max-h-40 whitespace-pre-wrap break-words text-muted"
          >{{ msg.content }}</pre>
        </div>
      </template>

      <div v-if="getOutputMessages(trace).length === 0" class="text-sm text-muted text-center py-4">
        No conversation data
      </div>
    </div>

    <!-- Metadata view -->
    <div v-else-if="activeTab === 'metadata'">
      <pre class="text-xs bg-gray-50 dark:bg-gray-900 rounded-lg p-4 overflow-auto max-h-[60vh] whitespace-pre-wrap break-words">{{ formatJson(trace.metadata) }}</pre>
    </div>
  </div>
</template>
