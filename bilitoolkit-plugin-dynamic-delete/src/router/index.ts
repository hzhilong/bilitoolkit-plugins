import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

export const appMenus: Array<RouteRecordRaw & { title: string }> = [
  {
    title: '删除转发动态',
    path: '/DeleteForwardView',
    name: 'DeleteForwardView',
    component: () => import('../views/DeleteForwardView.vue'),
  },
  {
    title: '删除图文动态',
    path: '/DeleteOpusView',
    name: 'DeleteOpusView',
    component: () => import('../views/DeleteOpusView.vue'),
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
