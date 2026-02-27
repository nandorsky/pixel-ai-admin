<script setup lang="ts">
interface Customer {
  id: string
  email: string | null
  name: string | null
  totalSpend: number
  created: number
}

const toast = useToast()

const customers = ref<Customer[]>([])
const total = ref(0)
const totalRevenue = ref(0)
const isLoading = ref(true)

async function fetchCustomers() {
  isLoading.value = true
  try {
    const result = await $fetch<any>('/api/stripe/customers')
    customers.value = result.customers || []
    total.value = result.total || 0
    totalRevenue.value = result.totalRevenue || 0
  } catch (err: any) {
    toast.add({
      title: 'Error loading billing data',
      description: err.message || 'Failed to fetch Stripe data',
      color: 'error'
    })
  }
  isLoading.value = false
}

onMounted(() => {
  fetchCustomers()
})

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <UDashboardPanel id="payments">
    <template #header>
      <UDashboardNavbar title="Payments">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Stats -->
      <div class="flex items-center gap-3 mb-6">
        <div class="bg-elevated px-4 py-2 rounded-lg">
          <span class="text-xs text-muted uppercase tracking-wide">Customers</span>
          <UIcon v-if="isLoading" name="i-lucide-loader-2" class="size-4 animate-spin text-muted ml-2 inline-block align-middle" />
          <span v-else class="text-lg font-semibold text-highlighted ml-2">{{ customers.filter(c => c.totalSpend > 0).length.toLocaleString() }}</span>
        </div>
        <div class="bg-elevated px-4 py-2 rounded-lg">
          <span class="text-xs text-muted uppercase tracking-wide">Total Revenue</span>
          <UIcon v-if="isLoading" name="i-lucide-loader-2" class="size-4 animate-spin text-muted ml-2 inline-block align-middle" />
          <span v-else class="text-lg font-semibold text-highlighted ml-2">{{ formatCurrency(totalRevenue) }}</span>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-muted" />
      </div>

      <!-- Customer list -->
      <div v-else-if="customers.length" class="bg-elevated rounded-lg divide-y divide-default">
        <div
          v-for="customer in customers"
          :key="customer.id"
          class="flex items-center gap-4 px-4 py-3"
        >
          <div class="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-medium text-muted shrink-0">
            {{ (customer.name || customer.email || '?').charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-highlighted truncate">
              {{ customer.name || customer.email || 'Unknown' }}
            </div>
            <div v-if="customer.name && customer.email" class="text-xs text-muted truncate">
              {{ customer.email }}
            </div>
          </div>
          <div class="text-right shrink-0">
            <div class="text-sm font-semibold text-highlighted">
              {{ formatCurrency(customer.totalSpend) }}
            </div>
            <div class="text-xs text-muted">
              since {{ formatDate(customer.created) }}
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-12 text-muted text-sm">
        No customers found
      </div>
    </template>
  </UDashboardPanel>
</template>
