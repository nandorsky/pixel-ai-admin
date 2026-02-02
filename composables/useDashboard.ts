import { useRouter } from 'vue-router'
import { createSharedComposable } from '@vueuse/core'

const _useDashboard = () => {
  const router = useRouter()
  const sidebarCollapsed = ref(false)

  defineShortcuts({
    'g-h': () => router.push('/'),
    'g-s': () => router.push('/customers')
  })

  return {
    sidebarCollapsed
  }
}

export const useDashboard = createSharedComposable(_useDashboard)
