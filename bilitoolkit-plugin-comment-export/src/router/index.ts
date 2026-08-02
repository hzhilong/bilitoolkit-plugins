import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

export const appMenus: Array<RouteRecordRaw & { title: string }> = [
  {
    title: '评论导出',
    path: '/CommentExport',
    name: 'CommentExport',
    component: () => import('../views/CommentExportView.vue'),
  },
  {
    title: '浏览数据',
    path: '/CommentImport',
    name: 'CommentImport',
    component: () => import('../views/CommentImportView.vue'),
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
