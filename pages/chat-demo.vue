<script setup lang="ts">
definePageMeta({
  layout: 'blank'
})

const promptText = ref('')

const bestPractices = ['Goal', 'Company', 'Channels', 'Audience', 'Budget']

const examplePrompts = [
  'Generate 50 demo signups for Nextiva targeting B2B founders on LinkedIn and Facebook',
  'Drive 100 free trial signups for Slack targeting startup teams on Instagram and Google Ads',
  'Get 200 webinar registrations for HubSpot targeting marketing managers on LinkedIn and Twitter',
  'Acquire 75 qualified leads for Salesforce targeting enterprise CTOs on LinkedIn and YouTube'
]

function selectPrompt(prompt: string) {
  promptText.value = prompt
}
</script>

<template>
  <div class="flex h-screen min-h-0 bg-gray-50 flex-col lg:flex-row overflow-x-hidden">
    <!-- Sidebar -->
    <div class="order-2 lg:order-1 w-full lg:w-auto flex-none">
      <aside class="relative flex flex-row lg:flex-col w-full lg:w-14 h-auto lg:h-screen bg-white flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-100 lg:justify-between">
        <div class="flex flex-row lg:flex-col items-center justify-around lg:justify-start flex-1 lg:flex-none py-2 lg:py-4 gap-0 lg:gap-4">
          <!-- Logo -->
          <div class="pl-4 pr-4 lg:pl-0 lg:pr-0 lg:pt-2 lg:pb-7">
            <a href="/" aria-label="Home">
              <svg width="89" height="110" viewBox="0 0 88.795799 110.262" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-8 h-8">
                <path d="m 88.7958,73.503 h -7.4019 v 7.3601 h 7.4019 z" fill="#4879ff" />
                <path d="m 88.7958,66.1574 h -7.4019 v 7.3456 h 7.4019 z" fill="#4879ff" />
                <path d="m 88.7958,58.8108 h -7.4019 v 7.3466 h 7.4019 z" fill="#4879ff" />
                <path d="m 81.395,88.2098 h -7.402 v 7.3461 h 7.402 z" fill="#4879ff" />
                <path d="m 81.395,80.8632 h -7.402 v 7.3466 h 7.402 z" fill="#4879ff" />
                <path d="m 81.395,73.503 h -7.402 v 7.3602 h 7.402 z" fill="#4879ff" />
                <path d="m 81.395,66.1574 h -7.402 v 7.3456 h 7.402 z" fill="#4879ff" />
                <path d="m 81.395,58.8108 h -7.402 v 7.3466 h 7.402 z" fill="#4879ff" />
                <path d="m 81.395,51.4652 h -7.402 v 7.3456 h 7.402 z" fill="#4879ff" />
                <path d="m 81.395,44.1048 h -7.402 v 7.3604 h 7.402 z" fill="#3255b7" />
                <path d="m 73.9908,95.5554 h -7.402 v 7.3596 h 7.402 z" fill="#00b3ff" />
                <path d="m 73.9908,88.2098 h -7.402 v 7.3456 h 7.402 z" fill="#00b3ff" />
                <path d="m 73.9908,80.8632 h -7.402 v 7.3466 h 7.402 z" fill="#00b3ff" />
                <path d="m 73.9908,73.503 h -7.402 v 7.3602 h 7.402 z" fill="#00b3ff" />
                <path d="m 73.9908,66.1574 h -7.402 v 7.3456 h 7.402 z" fill="#00b3ff" />
                <path d="m 73.9908,58.8108 h -7.402 v 7.3466 h 7.402 z" fill="#4879ff" />
                <path d="m 73.9908,51.4652 h -7.402 v 7.3456 h 7.402 z" fill="#4879ff" />
                <path d="m 73.9908,44.1048 h -7.402 v 7.3604 h 7.402 z" fill="#4879ff" />
                <path d="m 73.9908,36.7584 h -7.402 v 7.3464 h 7.402 z" fill="#4834d1" />
                <path d="m 66.5888,102.915 -7.3875,10e-4 v 7.346 h 7.388 z" fill="#00b3ff" />
                <path d="m 66.5888,95.5554 h -7.3875 v 7.3606 l 7.3875,-10e-4 z" fill="#00b3ff" />
                <path d="m 66.5888,88.2098 h -7.3875 v 7.3456 h 7.3875 z" fill="#00eaff" />
                <path d="m 66.5888,80.8632 h -7.3875 v 7.3466 h 7.3875 z" fill="#00eaff" />
                <path d="m 66.5888,73.503 h -7.3875 v 7.3602 h 7.3875 z" fill="#00b3ff" />
                <path d="m 66.5888,66.1574 h -7.3875 v 7.3456 h 7.3875 z" fill="#00b3ff" />
                <path d="m 66.5888,58.8108 h -7.3875 v 7.3466 h 7.3875 z" fill="#00b3ff" />
                <path d="m 66.5888,51.4652 h -7.3875 v 7.3456 h 7.3875 z" fill="#4879ff" />
                <path d="m 66.5888,44.1048 h -7.3875 v 7.3604 h 7.3875 z" fill="#4879ff" />
                <path d="m 59.203,102.916 h -7.402 v 7.346 h 7.402 z" fill="#00eaff" />
                <path d="m 59.203,95.5554 h -7.402 v 7.3606 h 7.402 z" fill="#00eaff" />
                <path d="m 59.203,88.2098 h -7.402 v 7.3456 h 7.402 z" fill="#00eaff" />
                <path d="m 59.203,80.8632 h -7.402 v 7.3466 h 7.402 z" fill="#00eaff" />
                <path d="m 59.203,73.503 h -7.402 v 7.3602 h 7.402 z" fill="#00eaff" />
                <path d="m 59.203,66.1574 h -7.402 v 7.3456 h 7.402 z" fill="#00eaff" />
                <path d="m 59.203,58.8108 h -7.402 v 7.3466 h 7.402 z" fill="#00b3ff" />
                <path d="m 59.203,51.4652 h -7.402 v 7.3456 h 7.402 z" fill="#4879ff" />
                <path d="m 59.203,44.1048 h -7.402 v 7.3604 h 7.402 z" fill="#4879ff" />
                <path d="m 59.203,22.0524 h -7.402 v 7.3601 h 7.402 z" fill="#4834d1" />
                <path d="m 59.203,14.7059 h -7.402 v 7.3465 h 7.402 z" fill="#4834d1" />
                <path d="m 51.8022,102.916 h -7.402 v 7.346 h 7.402 z" fill="#ff7a00" />
                <path d="m 51.8022,95.5623 h -7.402 v 7.3457 h 7.402 z" fill="#ff7a00" />
                <path d="m 51.8022,88.2093 h -7.402 v 7.3466 h 7.402 z" fill="#ff7a00" />
                <path d="m 51.8022,80.8632 h -7.402 v 7.3461 h 7.402 z" fill="#00eaff" />
                <path d="m 51.8022,73.503 h -7.402 v 7.3602 h 7.402 z" fill="#00eaff" />
                <path d="m 51.8022,66.1574 h -7.402 v 7.3456 h 7.402 z" fill="#00eaff" />
                <path d="m 51.8022,58.8108 h -7.402 v 7.3466 h 7.402 z" fill="#00b3ff" />
                <path d="m 51.8022,51.4652 h -7.402 v 7.3456 h 7.402 z" fill="#00b3ff" />
                <path d="m 51.8022,44.1048 h -7.402 v 7.3604 h 7.402 z" fill="#4879ff" />
                <path d="m 51.8022,36.7584 h -7.402 v 7.3464 h 7.402 z" fill="#4879ff" />
                <path d="m 51.8022,29.4128 h -7.402 v 7.3456 h 7.402 z" fill="#4879ff" />
                <path d="m 51.8022,22.0524 h -7.402 v 7.3604 h 7.402 z" fill="#4879ff" />
                <path d="m 51.8022,14.7059 h -7.402 v 7.3465 h 7.402 z" fill="#4879ff" />
                <path d="m 51.8022,7.3602 h -7.402 v 7.3457 h 7.402 z" fill="#4834d1" />
                <path d="m 44.4002,102.916 h -7.4025 v 7.346 h 7.4025 z" fill="#ff7a00" />
                <path d="m 44.4002,95.5623 h -7.4025 v 7.3457 h 7.4025 z" fill="#ff7a00" />
                <path d="m 44.4002,88.2093 h -7.4025 v 7.3466 h 7.4025 z" fill="#ff7a00" />
                <path d="m 44.4002,80.8632 h -7.4025 v 7.3461 h 7.4025 z" fill="#00eaff" />
                <path d="m 44.4002,73.503 h -7.4025 v 7.3602 h 7.4025 z" fill="#00eaff" />
                <path d="m 44.4002,66.1574 h -7.4025 v 7.3456 h 7.4025 z" fill="#00eaff" />
                <path d="m 44.3859,58.8069 h -7.4021 v 7.3461 h 7.4021 z" fill="#00eaff" />
                <path d="m 44.4002,51.4652 h -7.4025 v 7.3461 l 7.4025,-5e-4 z" fill="#00b3ff" />
                <path d="m 44.4002,44.1048 h -7.4025 v 7.3604 h 7.4025 z" fill="#00b3ff" />
                <path d="m 44.4002,36.7584 h -7.4025 v 7.3464 h 7.4025 z" fill="#4879ff" />
                <path d="m 44.4002,29.4128 h -7.4025 v 7.3456 h 7.4025 z" fill="#4879ff" />
                <path d="m 44.4002,22.0524 h -7.4025 v 7.3604 h 7.4025 z" fill="#4879ff" />
                <path d="m 44.4002,14.7059 h -7.4025 v 7.3465 h 7.4025 z" fill="#4834d1" />
                <path d="m 44.4002,7.3602 h -7.4025 v 7.3457 h 7.4025 z" fill="#4834d1" />
                <path d="m 44.3997,0 h -7.402 v 7.3602 h 7.4025 z" fill="#4834d1" />
                <path d="m 36.996,102.916 h -7.402 v 7.346 h 7.402 z" fill="#ff7a00" />
                <path d="m 36.996,95.5554 h -7.402 v 7.3606 h 7.402 z" fill="#ff7a00" />
                <path d="m 36.996,88.2098 h -7.402 v 7.3456 h 7.402 z" fill="#ff7a00" />
                <path d="m 36.996,80.8632 h -7.402 v 7.3466 h 7.402 z" fill="#00eaff" />
                <path d="m 36.996,73.503 h -7.402 v 7.3602 h 7.402 z" fill="#00eaff" />
                <path d="m 36.996,66.1574 h -7.402 v 7.3456 h 7.402 z" fill="#00eaff" />
                <path d="m 36.996,58.8108 h -7.402 v 7.3466 h 7.402 z" fill="#00b3ff" />
                <path d="m 36.996,51.4652 h -7.402 v 7.3456 h 7.402 z" fill="#00b3ff" />
                <path d="m 36.996,44.1048 h -7.402 v 7.3604 h 7.402 z" fill="#00b3ff" />
                <path d="m 36.996,36.7584 h -7.402 v 7.3464 h 7.402 z" fill="#4879ff" />
                <path d="m 36.996,29.4128 h -7.402 v 7.3456 h 7.402 z" fill="#4879ff" />
                <path d="m 36.996,22.0524 h -7.402 v 7.3604 h 7.402 z" fill="#4834d1" />
                <path d="m 29.594,102.916 h -7.3881 v 7.346 h 7.3881 z" fill="#00eaff" />
                <path d="m 29.594,95.5554 h -7.3881 v 7.3606 h 7.3881 z" fill="#00eaff" />
                <path d="m 29.594,88.2098 h -7.3881 v 7.3456 h 7.3881 z" fill="#00eaff" />
                <path d="m 29.594,80.8632 h -7.3881 v 7.3466 h 7.3881 z" fill="#00eaff" />
                <path d="m 29.594,73.503 h -7.3881 v 7.3602 h 7.3881 z" fill="#00eaff" />
                <path d="M 29.594,66.1574 H 22.2059 V 73.503 H 29.594 Z" fill="#00b3ff" />
                <path d="m 29.594,58.8108 h -7.3881 v 7.3466 h 7.3881 z" fill="#00b3ff" />
                <path d="m 29.594,51.4652 h -7.3881 v 7.3456 h 7.3881 z" fill="#00b3ff" />
                <path d="m 29.594,44.1048 h -7.3881 v 7.3604 h 7.3881 z" fill="#4879ff" />
                <path d="m 29.594,36.7584 h -7.3881 v 7.3464 h 7.3881 z" fill="#4879ff" />
                <path d="m 29.594,29.4128 h -7.3881 v 7.3456 h 7.3881 z" fill="#4834d1" />
                <path d="m 22.2059,95.5554 h -7.4026 v 7.3596 l 7.4026,10e-4 z" fill="#00b3ff" />
                <path d="m 22.2059,88.2098 h -7.4026 v 7.3456 h 7.4026 z" fill="#00b3ff" />
                <path d="m 22.2059,80.8632 h -7.4026 v 7.3466 h 7.4026 z" fill="#00b3ff" />
                <path d="m 22.2059,73.503 h -7.4026 v 7.3602 h 7.4026 z" fill="#00b3ff" />
                <path d="m 22.2059,66.1574 h -7.4026 v 7.3456 h 7.4026 z" fill="#00b3ff" />
                <path d="m 22.2059,58.8108 h -7.4026 v 7.3466 h 7.4026 z" fill="#00b3ff" />
                <path d="m 22.2059,51.4652 h -7.4026 v 7.3456 h 7.4026 z" fill="#4879ff" />
                <path d="m 22.2059,44.1048 h -7.4026 v 7.3604 h 7.4026 z" fill="#4879ff" />
                <path d="m 22.2059,36.7584 h -7.4026 v 7.3464 h 7.4026 z" fill="#4834d1" />
                <path d="M 14.8058,88.2098 H 7.4037 v 7.3461 h 7.4021 z" fill="#4879ff" />
                <path d="M 14.8058,80.8632 H 7.4037 v 7.3466 h 7.4021 z" fill="#4879ff" />
                <path d="M 14.8058,73.503 H 7.4037 v 7.3602 h 7.4021 z" fill="#4879ff" />
                <path d="M 14.8058,66.1574 H 7.4037 v 7.3456 h 7.4021 z" fill="#4879ff" />
                <path d="M 14.8058,58.8108 H 7.4037 v 7.3466 h 7.4021 z" fill="#4879ff" />
                <path d="M 14.8058,51.4652 H 7.4037 v 7.3456 h 7.4021 z" fill="#4879ff" />
                <path d="M 14.8058,44.1048 H 7.4037 v 7.3604 h 7.4021 z" fill="#4834d1" />
                <path d="M 7.40198,80.8632 H 0 v 7.3461 h 7.40198 z" fill="#3255b7" />
                <path d="M 7.40198,73.503 H 0 v 7.3602 h 7.40198 z" fill="#3255b7" />
                <path d="M 7.40198,66.1574 H 0 v 7.3456 h 7.40198 z" fill="#3255b7" />
                <path d="M 7.40198,58.8108 H 0 v 7.3466 h 7.40198 z" fill="#3255b7" />
                <path d="M 7.40198,51.4652 H 0 v 7.3456 h 7.40198 z" fill="#3255b7" />
              </svg>
            </a>
          </div>

          <!-- Nav buttons -->
          <button
            class="w-12 lg:w-10 h-12 lg:h-10 rounded-xl flex items-center justify-center text-xl flex-1 lg:flex-none transition-colors duration-200 text-teal-600 hover:text-teal-700"
            title="New prompt"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
            </svg>
          </button>

          <button
            class="w-12 lg:w-10 h-12 lg:h-10 rounded-xl flex items-center justify-center text-xl flex-1 lg:flex-none transition-colors duration-200 text-black hover:text-teal-600"
            title="Bookmark"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
            </svg>
          </button>

          <button
            class="w-12 lg:w-10 h-12 lg:h-10 rounded-xl flex items-center justify-center text-xl flex-1 lg:flex-none transition-colors duration-200 text-black hover:text-teal-600"
            title="History"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M12 7v5l4 2" />
            </svg>
          </button>

          <button
            class="w-12 lg:w-10 h-12 lg:h-10 rounded-xl flex items-center justify-center text-xl flex-1 lg:flex-none transition-colors duration-200 text-black hover:text-teal-600"
            title="Library"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
              <path d="m16 6 4 14" />
              <path d="M12 6v14" />
              <path d="M8 8v12" />
              <path d="M4 4v16" />
            </svg>
          </button>

          <button
            class="w-12 lg:w-10 h-12 lg:h-10 rounded-xl flex items-center justify-center text-xl flex-1 lg:flex-none transition-colors duration-200 text-black hover:text-teal-600"
            title="Campaigns"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
              <path d="m3 11 18-5v12L3 14v-3z" />
              <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
            </svg>
          </button>
        </div>

        <!-- Settings button -->
        <div class="flex flex-row lg:flex-col items-center justify-around lg:justify-between flex-1 lg:flex-none py-2 lg:py-4 gap-0 lg:gap-3 border-gray-100">
          <button
            class="w-12 lg:w-10 h-12 lg:h-10 rounded-xl flex items-center justify-center text-xl text-black hover:text-teal-600 transition-colors flex-1 lg:flex-none"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </aside>
    </div>

    <!-- Main content -->
    <div class="flex flex-col flex-1 order-1 lg:order-2 min-h-0 bg-gradient-to-br from-gray-50 to-gray-100">
      <!-- Header -->
      <header class="sticky top-0 z-20 w-full bg-transparent px-4 sm:px-6 py-3 sm:py-4">
        <div class="grid grid-cols-[1fr_auto] items-center gap-3">
          <div class="min-w-0 flex items-center gap-3 flex-wrap">
            <div class="flex items-center">
              <button class="px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                <span class="pr-5">Pixel AI</span>
              </button>
            </div>
          </div>
          <div class="flex items-center gap-4 ml-auto">
            <div class="flex items-center gap-4">
              <div class="flex flex-col items-start text-sm text-gray-600">
                <div class="flex items-center gap-2">
                  <span class="font-bold">Early Access</span>
                </div>
              </div>
              <div class="relative">
                <button class="focus:outline-none hover:opacity-80 transition-opacity">
                  <div class="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
                    <img
                      src="https://s.gravatar.com/avatar/866f959d27d66c3ff1f2ce36a470c4df?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fna.png"
                      alt="Avatar"
                      class="w-10 h-10 object-cover rounded-full"
                    >
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Main area -->
      <main class="flex-1 flex flex-col w-full relative overflow-x-hidden">
        <div class="flex-1 flex flex-col w-full relative overflow-x-hidden transition-all duration-500">
          <!-- Chat messages area (hidden initially) -->
          <div class="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-20 hidden">
            <div class="flex-1 flex flex-col w-full" />
          </div>

          <!-- Welcome / Input area -->
          <div class="flex flex-col transition-all duration-500 ease-in-out px-4 sm:px-6 lg:px-8 flex-1 justify-center items-center pb-16 sm:pb-20">
            <!-- Welcome text -->
            <div class="w-full mb-8">
              <div class="flex flex-col items-center justify-center text-center px-6">
                <div class="w-full max-w-2xl space-y-3">
                  <div aria-live="polite">
                    <p class="text-base text-gray-400 leading-tight">
                      <span class="text-2xl font-bold text-gray-900 leading-tight block whitespace-normal sm:whitespace-nowrap">
                        Optimize Campaign Performance
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Example prompts -->
            <div class="w-full max-w-4xl mx-auto px-4 sm:px-6 mb-6">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  v-for="(prompt, index) in examplePrompts"
                  :key="index"
                  class="p-4 bg-white border border-gray-200 rounded-xl text-left text-sm text-gray-600 hover:border-teal-300 hover:bg-teal-50 transition-colors duration-200 shadow-sm"
                  @click="selectPrompt(prompt)"
                >
                  <p class="line-clamp-2">{{ prompt }}</p>
                </button>
              </div>
            </div>

            <!-- Input area -->
            <div class="w-full">
              <!-- Hint chips -->
              <div class="max-w-full sm:max-w-4xl w-full mx-auto px-4 sm:px-6 mb-3">
                <div class="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-100 rounded-lg mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-teal-500 flex-shrink-0">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4"/>
                    <path d="M12 8h.01"/>
                  </svg>
                  <span class="text-sm text-teal-700">
                    <span class="font-medium">Tip:</span> Include your goal, company, channels, audience, and budget for best results
                  </span>
                </div>
              </div>

              <div class="sticky bottom-2 sm:bottom-6 md:bottom-8 max-w-full sm:max-w-4xl w-full mx-auto px-4 sm:px-6 z-10">
                <div class="bg-white rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
                  <textarea
                    v-model="promptText"
                    placeholder=""
                    rows="3"
                    class="w-full block resize-none border-0 outline-none text-gray-900 placeholder-gray-400 bg-transparent pt-4 pb-14 px-5 disabled:text-gray-400"
                    style="height: 144px; overflow-y: hidden;"
                  />
                  <div class="absolute left-2 bottom-2 flex items-center gap-0.5 bg-white/80 backdrop-blur-sm">
                    <button
                      type="button"
                      class="p-2 transition-colors text-gray-400 hover:text-gray-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6">
                        <line x1="21" x2="14" y1="4" y2="4" />
                        <line x1="10" x2="3" y1="4" y2="4" />
                        <line x1="21" x2="12" y1="12" y2="12" />
                        <line x1="8" x2="3" y1="12" y2="12" />
                        <line x1="21" x2="16" y1="20" y2="20" />
                        <line x1="12" x2="3" y1="20" y2="20" />
                        <line x1="14" x2="14" y1="2" y2="6" />
                        <line x1="8" x2="8" y1="10" y2="14" />
                        <line x1="16" x2="16" y1="18" y2="22" />
                      </svg>
                    </button>
                    <input
                      accept=".csv,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.svg,image/*"
                      class="hidden"
                      aria-label="Upload file"
                      type="file"
                    >
                    <button
                      type="button"
                      class="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Attach file"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6">
                        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
