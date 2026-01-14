<script setup lang="ts">
import type { Period, Range } from '~/types'

const supabase = useSupabase()

defineProps<{
  period: Period
  range: Range
}>()

const totalSignups = ref(0)
const loading = ref(true)

async function fetchTotalSignups() {
  loading.value = true

  const { count, error } = await supabase
    .from('signups')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error fetching signups count:', error)
  } else {
    totalSignups.value = count || 0
  }

  loading.value = false
}

onMounted(() => {
  fetchTotalSignups()
})
</script>

<template>
  <UPageGrid class="lg:grid-cols-1 gap-4 sm:gap-6">
    <UPageCard
      icon="i-lucide-users"
      title="Signups"
      to="/customers"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25',
        title: 'font-normal text-muted text-xs uppercase'
      }"
      class="rounded-lg"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ loading ? '...' : totalSignups.toLocaleString() }}
        </span>
      </div>
    </UPageCard>
  </UPageGrid>
</template>
