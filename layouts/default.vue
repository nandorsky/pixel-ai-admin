<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const supabase = useSupabase()
const open = ref(false)
const collapsed = ref(false)

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
  label: 'Waitlist',
  icon: 'i-lucide-list-check',
  to: '/signups',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Signups',
  icon: 'i-lucide-user-plus',
  to: '/app-signups',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Prompts',
  icon: 'i-lucide-activity',
  to: '/traces',
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
  label: 'Inbox',
  icon: 'i-lucide-mail',
  to: '/inbox',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Campaigns',
  icon: 'i-lucide-megaphone',
  to: '/campaigns',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Email Accounts',
  icon: 'i-lucide-at-sign',
  to: '/email-accounts',
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
      v-model:collapsed="collapsed"
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
