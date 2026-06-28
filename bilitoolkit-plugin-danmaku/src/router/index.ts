import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

export const appMenus: Array<RouteRecordRaw & { title: string }> = [
  {
    title: '弹幕查询',
    path: '/DanmakuSearch',
    name: 'DanmakuSearch',
    component: () => import('../views/DanmakuSearch.vue'),
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
