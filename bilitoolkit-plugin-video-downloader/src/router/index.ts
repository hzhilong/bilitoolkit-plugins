import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

export const appMenus: Array<RouteRecordRaw & { title: string }> = [
  {
    title: '视频下载',
    path: '/VideoDownloadView',
    name: 'VideoDownloadView',
    component: () => import('../views/VideoDownloadView.vue'),
  },
  {
    title: '设置',
    path: '/SettingsView',
    name: 'SettingsView',
    component: () => import('../views/SettingsView.vue'),
  },
  {
    title: '关于',
    path: '/AboutView',
    name: 'AboutView',
    component: () => import('../views/AboutView.vue'),
  },
]

export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: appMenus[0].path,
    },
    ...appMenus,
  ],
})
