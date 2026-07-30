import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

export const appMenus: Array<RouteRecordRaw & { title: string }> = [
  {
    title: '实时弹幕',
    path: '/RealTimeView',
    name: 'RealTimeView',
    component: () => import('../views/RealTimeView.vue'),
  },
  {
    title: '历史弹幕',
    path: '/HistoryView',
    name: 'HistoryView',
    component: () => import('../views/HistoryView.vue'),
  },
  {
    title: '弹幕文件',
    path: '/DMFileView',
    name: 'DMFileView',
    component: () => import('../views/DMFileView.vue'),
  },
  {
    title: '解密 mid',
    path: '/CrackUid',
    name: 'CrackUid',
    component: () => import('../views/CrackUid.vue'),
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
