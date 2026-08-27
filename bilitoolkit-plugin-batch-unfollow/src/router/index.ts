import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

export const appMenus: Array<RouteRecordRaw & { title: string }> = [
  {
    title: '批量取关',
    path: '/BatchUnfollow',
    name: 'BatchUnfollow',
    component: () => import('../views/BatchUnfollowView.vue'),
  },
  {
    title: '取关已注销用户',
    path: '/UnfollowCancelledView',
    name: 'UnfollowCancelledView',
    component: () => import('../views/UnfollowCancelledView.vue'),
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
