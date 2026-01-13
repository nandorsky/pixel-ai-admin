<script setup lang="ts">
import { ref } from 'vue'
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)

const links = [[{
  label: 'Home',
  icon: 'i-lucide-house',
  to: '/',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Signups',
  icon: 'i-lucide-users',
  to: '/signups',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Referrals',
  icon: 'i-lucide-share-2',
  to: '/referrals',
  onSelect: () => {
    open.value = false
  }
}]] satisfies NavigationMenuItem[][]
</script>

<template>
  <Suspense>
    <UApp>
      <UDashboardGroup unit="rem" storage="local">
        <UDashboardSidebar
          id="default"
          v-model:open="open"
          collapsible
          resizable
          class="bg-elevated/25"
        >
          <template #header="{ collapsed }">
            <TeamsMenu :collapsed="collapsed" />
          </template>

          <template #default="{ collapsed }">
            <UNavigationMenu
              :collapsed="collapsed"
              :items="links[0]"
              orientation="vertical"
              tooltip
            />
          </template>
        </UDashboardSidebar>

        <RouterView />
      </UDashboardGroup>
    </UApp>
  </Suspense>
</template>
