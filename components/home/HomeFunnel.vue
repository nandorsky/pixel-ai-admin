<script setup lang="ts">
const props = defineProps<{
  signups: number
  active: number
  paying: number
}>()

const activePct = computed(() => props.signups > 0 ? Math.round((props.active / props.signups) * 100) : 0)
const payingPct = computed(() => props.active > 0 ? Math.round((props.paying / props.active) * 100) : 0)

const signupWidth = computed(() => 100)
const activeWidth = computed(() => props.signups > 0 ? Math.max((props.active / props.signups) * 100, 8) : 8)
const payingWidth = computed(() => props.signups > 0 ? Math.max((props.paying / props.signups) * 100, 4) : 4)
</script>

<template>
  <div class="bg-elevated rounded-lg p-6">
    <h3 class="text-sm font-medium text-highlighted mb-5">Conversion Funnel</h3>

    <div class="space-y-3">
      <!-- Signups bar -->
      <div class="flex items-center gap-4">
        <div class="w-20 text-xs text-muted text-right shrink-0">Signups</div>
        <div class="flex-1">
          <div
            class="h-9 bg-primary/20 rounded flex items-center px-3 transition-all duration-500"
            :style="{ width: signupWidth + '%' }"
          >
            <span class="text-sm font-semibold text-highlighted">{{ signups.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- Arrow with conversion rate -->
      <div class="flex items-center gap-4">
        <div class="w-20 shrink-0" />
        <div class="flex items-center gap-2 pl-2">
          <UIcon name="i-lucide-arrow-down" class="size-3.5 text-muted" />
          <span class="text-xs font-medium text-primary">{{ activePct }}% activated</span>
        </div>
      </div>

      <!-- Active bar -->
      <div class="flex items-center gap-4">
        <div class="w-20 text-xs text-muted text-right shrink-0">Active</div>
        <div class="flex-1">
          <div
            class="h-9 bg-blue-500/20 rounded flex items-center px-3 transition-all duration-500"
            :style="{ width: activeWidth + '%' }"
          >
            <span class="text-sm font-semibold text-highlighted">{{ active.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- Arrow with conversion rate -->
      <div class="flex items-center gap-4">
        <div class="w-20 shrink-0" />
        <div class="flex items-center gap-2 pl-2">
          <UIcon name="i-lucide-arrow-down" class="size-3.5 text-muted" />
          <span class="text-xs font-medium text-blue-500">{{ payingPct }}% converted</span>
        </div>
      </div>

      <!-- Paying bar -->
      <div class="flex items-center gap-4">
        <div class="w-20 text-xs text-muted text-right shrink-0">Paying</div>
        <div class="flex-1">
          <div
            class="h-9 bg-emerald-500/20 rounded flex items-center px-3 transition-all duration-500"
            :style="{ width: payingWidth + '%' }"
          >
            <span class="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{{ paying.toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
