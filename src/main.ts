import './assets/css/main.css'

import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import ui from '@nuxt/ui/vue-plugin'

import App from './App.vue'

const app = createApp(App)

app.use(createRouter({
  routes: [
    { path: '/', component: () => import('./pages/index.vue') },
    { path: '/referrals', component: () => import('./pages/referrals.vue') },
    { path: '/signups', component: () => import('./pages/signups.vue') }
  ],
  history: createWebHistory()
}))

app.use(ui)

app.mount('#app')
