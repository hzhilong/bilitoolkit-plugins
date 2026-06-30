import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

export const appMenus: Array<RouteRecordRaw & { title: string }> = [
  {
    title: '评论',
    path: '/CommentImages',
    name: 'CommentImages',
    component: () => import('../views/CommentImages.vue'),
  },
  {
    title: '动态',
    path: '/DynamicImages',
    name: 'DynamicImages',
    component: () => import('../views/DynamicImages.vue'),
  },
  {
    title: '专栏',
    path: '/OpusImages',
    name: 'OpusImages',
    component: () => import('../views/OpusImages.vue'),
  },
  {
    title: '头像',
    path: '/UserFace',
    name: 'UserFace',
    component: () => import('../views/UserFace.vue'),
  },
  {
    title: '视频封面',
    path: '/VideoCover',
    name: 'VideoCover',
    component: () => import('../views/VideoCover.vue'),
  },
  {
    title: '直播封面',
    path: '/LiveCover',
    name: 'LiveCover',
    component: () => import('../views/LiveCover.vue'),
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
