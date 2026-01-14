import { useRouter } from 'vue-router'
import { createSharedComposable } from '@vueuse/core'

const _useDashboard = () => {
  const router = useRouter()

  defineShortcuts({
    'g-h': () => router.push('/'),
    'g-s': () => router.push('/customers')
  })

  return {}
}

export const useDashboard = createSharedComposable(_useDashboard)
