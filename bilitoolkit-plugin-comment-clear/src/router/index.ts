import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

export const appMenus: Array<RouteRecordRaw & { title: string }> = [
  {
    title: '根据互动通知删除评论',
    path: '/ClearByNotif',
    name: 'ClearByNotif',
    component: () => import('../views/ClearByNotifView.vue'),
  },
  {
    title: '根据 Aicu 删除评论',
    path: '/ClearByAicu',
    name: 'ClearByAicu',
    component: () => import('../views/ClearByAicuView.vue'),
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
