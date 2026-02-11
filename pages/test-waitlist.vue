<script setup lang="ts">
const email = ref('')
const firstName = ref('')
const lastName = ref('')
const result = ref('')
const isLoading = ref(false)

async function testSignup() {
  isLoading.value = true
  result.value = ''

  try {
    const response = await $fetch('/api/waitlist/signup', {
      method: 'POST',
      body: {
        email: email.value,
        firstName: firstName.value,
        lastName: lastName.value
      }
    })
    result.value = 'SUCCESS: ' + JSON.stringify(response, null, 2)
  } catch (error: any) {
    result.value = 'ERROR: ' + JSON.stringify(error.data || error.message, null, 2)
  }

  isLoading.value = false
}
</script>

<template>
  <div class="p-8 max-w-md mx-auto">
    <h1 class="text-2xl font-bold mb-6">Test Waitlist Signup</h1>

    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1">Email</label>
        <UInput
          v-model="email"
          type="email"
          placeholder="test@example.com"
        />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">First Name</label>
        <UInput
          v-model="firstName"
          placeholder="John"
        />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Last Name</label>
        <UInput
          v-model="lastName"
          placeholder="Doe"
        />
      </div>

      <UButton
        :disabled="isLoading || !email"
        :loading="isLoading"
        color="primary"
        size="lg"
        block
        @click="testSignup"
      >
        Test Signup
      </UButton>

      <div v-if="result" class="mt-4">
        <label class="block text-sm font-medium mb-1">Result:</label>
        <pre class="p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-sm overflow-auto whitespace-pre-wrap">{{ result }}</pre>
      </div>
    </div>
  </div>
</template>
