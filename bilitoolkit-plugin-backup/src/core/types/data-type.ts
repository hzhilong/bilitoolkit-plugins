/**
 * 数据类型映射数据
 */
export const DataTypeMap = {
  following: '关注',
  follower: '粉丝',
  to_view: '稍后再看',
  black: '黑名单',
  favorites: '收藏夹',
  fav_opuses: '收藏的专栏',
  bangumi: '我的追番追剧',
  fav_collected: '收藏的视频合集',
  history: '历史记录',
} as const

/**
 * 数据类型
 */
export type DataType = keyof typeof DataTypeMap
