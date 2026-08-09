import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

export const pluginMenus: Array<RouteRecordRaw & { title: string }> = [
  {
    title: '弹幕投票',
    path: '/PollView',
    name: 'PollView',
    component: () => import('../views/PollView.vue'),
  },
]

export const appMenus: Array<RouteRecordRaw & { children?: (RouteRecordRaw & { title: string })[] }> = [
  {
    path: '/',
    name: 'PluginApp',
    redirect: '/PollView',
    component: () => import('../PluginApp.vue'),
    children: [...pluginMenus],
  },
  {
    path: '/RealTimePollView',
    name: 'RealTimePollView',
    component: () => import('../views/RealTimePollView.vue'),
  },
]

export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [...appMenus],
})
