<script setup lang="ts">
interface Charge {
  id: string
  amount: number
  currency: string
  status: string
  created: number
  description: string | null
  invoice: string | null
}

interface Customer {
  id: string
  email: string | null
  name: string | null
  totalSpend: number
  chargeCount: number
  charges: Charge[]
  lastChargeAt: number | null
  firstChargeAt: number | null
  created: number
}

const toast = useToast()

const customers = ref<Customer[]>([])
const total = ref(0)
const totalRevenue = ref(0)
const isLoading = ref(true)
const expandedId = ref<string | null>(null)

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

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

const payingCustomers = computed(() => customers.value.filter(c => c.totalSpend > 0))

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

function formatDateTime(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function getInitial(customer: Customer): string {
  return (customer.name || customer.email || '?').charAt(0).toUpperCase()
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
      <div class="grid grid-cols-3 gap-4 mb-6">
        <div class="bg-elevated rounded-lg p-5">
          <div class="flex items-center gap-2 mb-1">
            <UIcon name="i-lucide-users" class="size-4 text-violet-500" />
            <span class="text-xs text-muted uppercase tracking-wide">Paying Customers</span>
          </div>
          <UIcon v-if="isLoading" name="i-lucide-loader-2" class="size-5 animate-spin text-muted" />
          <p v-else class="text-2xl font-semibold text-highlighted">{{ payingCustomers.length }}</p>
        </div>
        <div class="bg-elevated rounded-lg p-5">
          <div class="flex items-center gap-2 mb-1">
            <UIcon name="i-lucide-dollar-sign" class="size-4 text-emerald-500" />
            <span class="text-xs text-muted uppercase tracking-wide">Total Revenue</span>
          </div>
          <UIcon v-if="isLoading" name="i-lucide-loader-2" class="size-5 animate-spin text-muted" />
          <p v-else class="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{{ formatCurrency(totalRevenue) }}</p>
        </div>
        <div class="bg-elevated rounded-lg p-5">
          <div class="flex items-center gap-2 mb-1">
            <UIcon name="i-lucide-receipt" class="size-4 text-blue-500" />
            <span class="text-xs text-muted uppercase tracking-wide">Total Charges</span>
          </div>
          <UIcon v-if="isLoading" name="i-lucide-loader-2" class="size-5 animate-spin text-muted" />
          <p v-else class="text-2xl font-semibold text-highlighted">{{ payingCustomers.reduce((sum, c) => sum + c.chargeCount, 0) }}</p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-16 gap-3">
        <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-muted" />
        <p class="text-sm text-muted">Loading Stripe data...</p>
      </div>

      <!-- Customer list -->
      <div v-else-if="payingCustomers.length" class="space-y-2">
        <div
          v-for="customer in payingCustomers"
          :key="customer.id"
          class="bg-elevated rounded-lg overflow-hidden"
        >
          <!-- Customer row (clickable) -->
          <button
            class="w-full flex items-center gap-4 px-5 py-4 hover:bg-accented/50 transition-colors text-left cursor-pointer"
            @click="toggleExpand(customer.id)"
          >
            <div class="size-10 rounded-full bg-violet-500/15 flex items-center justify-center text-sm font-medium text-violet-400 shrink-0">
              {{ getInitial(customer) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-highlighted truncate">
                {{ customer.name || customer.email || 'Unknown' }}
              </p>
              <p v-if="customer.name && customer.email" class="text-xs text-muted truncate">
                {{ customer.email }}
              </p>
            </div>
            <div class="text-right shrink-0 mr-2">
              <p class="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {{ formatCurrency(customer.totalSpend) }}
              </p>
              <p class="text-xs text-muted">
                {{ customer.chargeCount }} charge{{ customer.chargeCount !== 1 ? 's' : '' }}
              </p>
            </div>
            <UIcon
              name="i-lucide-chevron-down"
              class="size-4 text-muted shrink-0 transition-transform duration-200"
              :class="{ 'rotate-180': expandedId === customer.id }"
            />
          </button>

          <!-- Expanded charge history -->
          <div v-if="expandedId === customer.id" class="border-t border-default">
            <!-- Summary bar -->
            <div class="px-5 py-3 bg-accented/30 flex items-center gap-6 text-xs text-muted">
              <span v-if="customer.firstChargeAt">
                First payment: <span class="text-highlighted font-medium">{{ formatDate(customer.firstChargeAt) }}</span>
              </span>
              <span v-if="customer.lastChargeAt">
                Last payment: <span class="text-highlighted font-medium">{{ formatDate(customer.lastChargeAt) }}</span>
              </span>
              <span>
                Stripe customer since: <span class="text-highlighted font-medium">{{ formatDate(customer.created) }}</span>
              </span>
            </div>

            <!-- Individual charges -->
            <div v-if="customer.charges.length" class="divide-y divide-default">
              <div
                v-for="charge in customer.charges"
                :key="charge.id"
                class="flex items-center gap-4 px-5 py-3 pl-19"
              >
                <div class="size-7 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <UIcon name="i-lucide-check" class="size-3.5 text-emerald-500" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-highlighted">
                    {{ formatCurrency(charge.amount) }}
                  </p>
                  <p v-if="charge.description" class="text-xs text-muted truncate">
                    {{ charge.description }}
                  </p>
                </div>
                <div class="text-xs text-muted shrink-0">
                  {{ formatDateTime(charge.created) }}
                </div>
              </div>
            </div>

            <div v-else class="px-5 py-4 text-xs text-muted">
              No charges found for this customer
            </div>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-16 text-muted text-sm">
        No paying customers found
      </div>
    </template>
  </UDashboardPanel>
</template>
