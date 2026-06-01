import type { PluginMenuData } from 'bilitoolkit-ui'

/**
 * 应用菜单
 */
export const appMenus: PluginMenuData[] = [
  {
    title: '备份数据',
    path: '/backup',
  },
  {
    title: '还原数据',
    path: '/restore',
  },
  {
    title: '清空数据',
    path: '/clear',
  },
  {
    title: '任务管理',
    path: '/tasks',
  },
  {
    title: '其他工具',
    path: '/tools',
  },
  {
    title: '插件设置',
    path: '/settings',
  },
]
