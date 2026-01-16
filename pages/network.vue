<script setup lang="ts">
import { Network } from 'vis-network'
import { DataSet } from 'vis-data'

const supabase = useSupabase()
const toast = useToast()

const networkContainer = ref<HTMLElement | null>(null)
const isLoading = ref(true)
const stats = ref({ total: 0, withReferrals: 0, maxDepth: 0 })
let network: Network | null = null

interface Signup {
  id: number
  email: string
  first_name: string | null
  last_name: string | null
  referral_code: string
  referred_by: string | null
}

async function fetchAndRenderNetwork() {
  isLoading.value = true

  const { data: signups, error } = await supabase
    .from('signups')
    .select('id, email, first_name, last_name, referral_code, referred_by')

  if (error) {
    toast.add({
      title: 'Error fetching data',
      description: error.message,
      color: 'error'
    })
    isLoading.value = false
    return
  }

  if (!signups || !networkContainer.value) {
    isLoading.value = false
    return
  }

  // Build maps
  const codeToSignup = new Map<string, Signup>()
  const idToSignup = new Map<number, Signup>()
  signups.forEach(s => {
    codeToSignup.set(s.referral_code, s)
    idToSignup.set(s.id, s)
  })

  // Calculate depth for each node (distance from root)
  const depths = new Map<number, number>()

  function calculateDepth(signup: Signup, visited = new Set<number>()): number {
    if (visited.has(signup.id)) return 0
    visited.add(signup.id)

    if (!signup.referred_by) {
      depths.set(signup.id, 0)
      return 0
    }

    const referrer = codeToSignup.get(signup.referred_by)
    if (!referrer) {
      depths.set(signup.id, 0)
      return 0
    }

    const depth = calculateDepth(referrer, visited) + 1
    depths.set(signup.id, depth)
    return depth
  }

  signups.forEach(s => calculateDepth(s))

  const maxDepth = Math.max(...depths.values(), 0)

  // Count referrals per user
  const referralCounts = new Map<number, number>()
  signups.forEach(s => {
    if (s.referred_by) {
      const referrer = codeToSignup.get(s.referred_by)
      if (referrer) {
        referralCounts.set(referrer.id, (referralCounts.get(referrer.id) || 0) + 1)
      }
    }
  })

  // Update stats
  stats.value = {
    total: signups.length,
    withReferrals: referralCounts.size,
    maxDepth
  }

  // Color scale based on depth (center = darker/primary, outer = lighter)
  const colors = [
    { bg: '#059669', border: '#047857' }, // emerald-600 - roots
    { bg: '#10b981', border: '#059669' }, // emerald-500
    { bg: '#34d399', border: '#10b981' }, // emerald-400
    { bg: '#6ee7b7', border: '#34d399' }, // emerald-300
    { bg: '#a7f3d0', border: '#6ee7b7' }, // emerald-200
  ]

  // Create nodes
  const nodes = new DataSet(
    signups.map(s => {
      const name = `${s.first_name || ''} ${s.last_name || ''}`.trim()
      const label = name || s.email.split('@')[0]
      const depth = depths.get(s.id) || 0
      const referralCount = referralCounts.get(s.id) || 0
      const colorIndex = Math.min(depth, colors.length - 1)
      const color = colors[colorIndex]

      // Size based on referral count
      const baseSize = 20
      const size = baseSize + (referralCount * 5)

      return {
        id: s.id,
        label,
        title: `${label}\n${s.email}\nReferred: ${referralCount} people\nGeneration: ${depth}`,
        level: depth,
        size: Math.min(size, 50),
        color: {
          background: color.bg,
          border: color.border,
          highlight: {
            background: color.bg,
            border: '#ffffff'
          }
        },
        font: {
          color: depth < 2 ? '#ffffff' : '#1f2937',
          size: 12,
          face: 'Inter, system-ui, sans-serif',
          strokeWidth: 2,
          strokeColor: depth < 2 ? '#000000' : '#ffffff'
        }
      }
    })
  )

  // Create edges (from referrer TO referred - showing growth direction)
  const edges = new DataSet(
    signups
      .filter(s => s.referred_by)
      .map(s => {
        const referrer = codeToSignup.get(s.referred_by!)
        if (!referrer) return null
        return {
          from: referrer.id,
          to: s.id,
          color: {
            color: '#6b7280',
            highlight: '#10b981'
          },
          width: 2
        }
      })
      .filter(Boolean) as any[]
  )

  // Network options - hierarchical radial layout
  const options = {
    nodes: {
      shape: 'dot',
      borderWidth: 3,
      shadow: {
        enabled: true,
        size: 5,
        x: 2,
        y: 2
      }
    },
    edges: {
      smooth: false
    },
    layout: {
      hierarchical: {
        enabled: true,
        direction: 'UD',
        sortMethod: 'directed',
        levelSeparation: 120,
        nodeSpacing: 180,
        treeSpacing: 200,
        shakeTowards: 'roots'
      }
    },
    physics: {
      enabled: false
    },
    interaction: {
      hover: true,
      tooltipDelay: 100,
      zoomView: true,
      dragView: true,
      dragNodes: true
    }
  }

  // Destroy existing network
  if (network) {
    network.destroy()
  }

  // Create network
  network = new Network(networkContainer.value, { nodes, edges }, options)

  // Fit to view after stabilization
  network.once('stabilized', () => {
    network?.fit({ animation: true })
  })

  isLoading.value = false
}

onMounted(() => {
  fetchAndRenderNetwork()
})

onUnmounted(() => {
  if (network) {
    network.destroy()
  }
})
</script>

<template>
  <UDashboardPanel id="network">
    <template #header>
      <UDashboardNavbar title="Referral Network">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col h-full">
        <!-- Legend and stats -->
        <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div class="flex items-center gap-6">
            <div class="flex items-center gap-2">
              <div class="size-4 rounded-full bg-emerald-600 border-2 border-emerald-700" />
              <span class="text-sm text-muted">Original signups</span>
            </div>
            <div class="flex items-center gap-1">
              <div class="size-3 rounded-full bg-emerald-500" />
              <div class="size-3 rounded-full bg-emerald-400" />
              <div class="size-3 rounded-full bg-emerald-300" />
              <span class="text-sm text-muted ml-1">Generations (darker = earlier)</span>
            </div>
          </div>
          <div class="flex items-center gap-4 text-sm text-muted">
            <span><strong class="text-highlighted">{{ stats.total }}</strong> total signups</span>
            <span><strong class="text-highlighted">{{ stats.withReferrals }}</strong> made referrals</span>
            <span><strong class="text-highlighted">{{ stats.maxDepth }}</strong> generations deep</span>
          </div>
        </div>

        <div v-if="isLoading" class="flex items-center justify-center h-96">
          <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-muted" />
        </div>

        <div
          ref="networkContainer"
          class="flex-1 min-h-[600px] rounded-lg border border-default bg-elevated/30"
        />

        <p class="text-xs text-muted mt-2">
          Lines connect referrers to who they referred. Larger nodes = more referrals. Hover for details.
        </p>
      </div>
    </template>
  </UDashboardPanel>
</template>
