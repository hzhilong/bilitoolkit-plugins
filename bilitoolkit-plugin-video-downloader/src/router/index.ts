import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

export const appMenus: Array<RouteRecordRaw & { title: string }> = [
  {
    title: '使用须知',
    path: '/AboutView',
    name: 'AboutView',
    component: () => import('../views/AboutView.vue'),
  },
  {
    title: '视频下载',
    path: '/VideoDownloadView',
    name: 'VideoDownloadView',
    component: () => import('../views/VideoDownloadView.vue'),
  },
  {
    title: '合集下载',
    path: '/CollectionDownloadView',
    name: 'CollectionDownloadView',
    component: () => import('../views/CollectionDownloadView.vue'),
  },
  {
    title: '收藏夹下载',
    path: '/FavDownloadView',
    name: 'FavDownloadView',
    component: () => import('../views/FavDownloadView.vue'),
  },
  {
    title: '设置',
    path: '/SettingsView',
    name: 'SettingsView',
    component: () => import('../views/SettingsView.vue'),
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
