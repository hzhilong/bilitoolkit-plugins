import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

export const appMenus: Array<RouteRecordRaw & { title: string }> = [
  {
    title: '视频封面',
    path: '/VideoCover',
    name: 'VideoCover',
    component: () => import('../views/VideoCover.vue'),
  },
  {
    title: '专栏图片',
    path: '/OpusPics',
    name: 'OpusPics',
    component: () => import('../views/OpusPics.vue'),
  },
  {
    title: '用户头像',
    path: '/UserFace',
    name: 'UserFace',
    component: () => import('../views/UserFace.vue'),
  },
  {
    title: '动态表情包',
    path: '/DynamicEmoji',
    name: 'DynamicEmoji',
    component: () => import('../views/DynamicEmoji.vue'),
  },
  {
    title: '评论表情包',
    path: '/CommentEmoji',
    name: 'CommentEmoji',
    component: () => import('../views/CommentEmoji.vue'),
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
