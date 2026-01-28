<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const supabase = useSupabase()
const open = ref(false)

async function logout() {
  await supabase.auth.signOut()
  navigateTo('/login')
}

const links = [[{
  label: 'Dashboard',
  icon: 'i-lucide-layout-dashboard',
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
}, {
  label: 'Leads',
  icon: 'i-lucide-target',
  to: '/leads',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Network',
  icon: 'i-lucide-git-branch',
  to: '/network',
  onSelect: () => {
    open.value = false
  }
}]] satisfies NavigationMenuItem[][]
</script>

<template>
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

      <template #footer="{ collapsed }">
        <div :class="['flex items-center gap-2', collapsed ? 'flex-col' : '']">
          <UColorModeButton />
          <UButton
            icon="i-lucide-log-out"
            color="neutral"
            variant="ghost"
            :label="collapsed ? undefined : 'Logout'"
            @click="logout"
          />
        </div>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
