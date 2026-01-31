<script setup lang="ts">
const route = useRoute()
const supabase = useSupabase()
const toast = useToast()

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
  email_address: string | null
}

const lead = ref<Lead | null>(null)
const isLoading = ref(true)

async function fetchLead() {
  isLoading.value = true
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', route.params.id)
    .single()

  if (error) {
    toast.add({
      title: 'Error fetching lead',
      description: error.message,
      color: 'error'
    })
  } else {
    lead.value = data
  }
  isLoading.value = false
}

onMounted(() => {
  fetchLead()
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

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text)
  toast.add({
    title: 'Copied to clipboard',
    description: `${label} copied to clipboard`
  })
}

const email = computed(() => lead.value?.email_address || null)

const isQualified = computed(() => {
  if (!lead.value) return false
  return lead.value.qualified === true || lead.value.qualified === 'TRUE'
})
</script>

<template>
  <UDashboardPanel :id="`lead-${route.params.id}`">
    <template #header>
      <UDashboardNavbar :title="lead?.fullName || 'Lead'">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            to="/leads"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin" />
      </div>

      <div v-else-if="lead" class="max-w-2xl space-y-6">
        <!-- Profile Header -->
        <div class="flex items-start gap-4">
          <img
            v-if="lead.profileImg"
            :src="lead.profileImg"
            :alt="lead.fullName"
            class="w-20 h-20 rounded-full object-cover shrink-0"
          />
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-3">
              <h2 class="text-xl font-semibold">{{ lead.fullName }}</h2>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                :class="{
                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': isQualified,
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': !isQualified
                }"
              >
                {{ isQualified ? 'Qualified' : 'Unqualified' }}
              </span>
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                :class="{
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': lead.type === 'agency',
                  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200': lead.type !== 'agency'
                }"
              >
                {{ lead.type }}
              </span>
            </div>
            <p v-if="lead.linkedinTitle" class="text-muted mt-1">{{ lead.linkedinTitle }}</p>
            <a
              v-if="lead.linkedinUrl"
              :href="lead.linkedinUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-2"
            >
              View LinkedIn Profile
              <UIcon name="i-lucide-external-link" class="w-3 h-3" />
            </a>
          </div>
        </div>

        <!-- Contact Information -->
        <UCard>
          <template #header>
            <h3 class="font-semibold">Contact Information</h3>
          </template>

          <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt class="text-sm text-muted">Name</dt>
              <dd class="mt-1 font-medium">{{ lead.fullName }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted">First Name</dt>
              <dd class="mt-1 font-medium">{{ lead.firstName || '—' }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted">Email</dt>
              <dd class="mt-1 font-medium flex items-center gap-2">
                <span>{{ email || '—' }}</span>
                <UButton
                  v-if="email"
                  icon="i-lucide-copy"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  @click="copyToClipboard(email, 'Email')"
                />
              </dd>
            </div>
            <div>
              <dt class="text-sm text-muted">LinkedIn URL</dt>
              <dd class="mt-1">
                <a
                  v-if="lead.linkedinUrl"
                  :href="lead.linkedinUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center gap-1"
                >
                  {{ lead.linkedinUrl }}
                  <UIcon name="i-lucide-external-link" class="w-3 h-3" />
                </a>
                <span v-else class="text-muted">—</span>
              </dd>
            </div>
          </dl>
        </UCard>

        <!-- Custom Prompt -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold">Email Copy</h3>
              <UButton
                v-if="lead.custom_prompt"
                icon="i-lucide-copy"
                color="neutral"
                variant="ghost"
                size="sm"
                label="Copy"
                @click="copyToClipboard(lead.custom_prompt, 'Email copy')"
              />
            </div>
          </template>

          <p v-if="lead.custom_prompt" class="whitespace-pre-wrap">{{ lead.custom_prompt }}</p>
          <p v-else class="text-muted">No email copy available</p>
        </UCard>

        <!-- Metadata -->
        <UCard>
          <template #header>
            <h3 class="font-semibold">Metadata</h3>
          </template>

          <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt class="text-sm text-muted">ID</dt>
              <dd class="mt-1 font-mono text-sm">{{ lead.id }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted">Created</dt>
              <dd class="mt-1">{{ formatDate(lead.created_at) }}</dd>
            </div>
          </dl>
        </UCard>
      </div>

      <div v-else class="text-center py-12 text-muted">
        Lead not found
      </div>
    </template>
  </UDashboardPanel>
</template>
