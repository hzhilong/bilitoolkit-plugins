import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

export const appMenus: Array<RouteRecordRaw & { title: string }> = [
  {
    title: '专栏下载',
    path: '/OpusDownload',
    name: 'OpusDownload',
    component: () => import('../views/OpusDownload.vue'),
  },
  {
    title: 'UP主专栏下载',
    path: '/UpperOpusDownload',
    name: 'UpperOpusDownload',
    component: () => import('../views/UpperOpusDownload.vue'),
  },
  {
    title: 'UP主专栏文集下载',
    path: '/OpusCollectionDownload',
    name: 'OpusCollectionDownload',
    component: () => import('../views/OpusCollectionDownload.vue'),
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
