<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()
</script>

<template>
  <div class="flex items-center gap-2 px-2 py-2">
    <div class="flex items-center justify-center size-8 rounded-md bg-primary text-primary-foreground font-bold text-sm">
      P
    </div>
    <span v-if="!collapsed" class="font-semibold text-highlighted">Pixel</span>
  </div>
</template>
