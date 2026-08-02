import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

export const appMenus: Array<RouteRecordRaw & { title: string }> = [
  {
    title: '导出黑名单',
    path: '/export',
    name: 'export',
    component: () => import('../views/ExportView.vue'),
  },
  {
    title: '导入黑名单',
    path: '/import',
    name: 'import',
    component: () => import('../views/ImportView.vue'),
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
