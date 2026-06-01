import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/backup',
    },
    {
      path: '/backup',
      name: 'backup',
      component: () => import('../views/BackupView.vue'),
    },
    {
      path: '/restore',
      name: 'restore',
      component: () => import('../views/RestoreView.vue'),
    },
    {
      path: '/clear',
      name: 'clear',
      component: () => import('../views/ClearView.vue'),
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: () => import('../views/TaskManage.vue'),
    },
    {
      path: '/tools',
      name: 'tools',
      component: () => import('../views/ToolsView.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'),
    },
  ],
})

export default router
