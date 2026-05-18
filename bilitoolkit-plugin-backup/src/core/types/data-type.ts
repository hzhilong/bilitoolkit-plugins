/**
 * 数据类型元数据
 */
export interface DataTypeMeta {
  type: string
  name: string
  backupDesc?: string
}

/**
 * 所有的数据类型
 */
export const AllDataTypes = [
  { type: 'following', name: '关注' },
  { type: 'follower', name: '粉丝' },
  { type: 'to_view', name: '稍后再看', backupDesc: '用户稍后再看的视频列表' },
  { type: 'black', name: '黑名单' },
  { type: 'favorites', name: '收藏夹' },
  { type: 'fav_opuses', name: '收藏的专栏' },
  { type: 'bangumi', name: '我的追番追剧' },
  { type: 'fav_collected', name: '收藏的视频合集' },
  { type: 'history', name: '历史记录' },
] as const satisfies DataTypeMeta[]

/**
 * 数据类型
 */
export type DataType = (typeof AllDataTypes)[number]['type']

/**
 * 数据类型映射数据
 */
export const DataTypeMap = Object.fromEntries(
  AllDataTypes.map((item) => [item.type as DataType, item as DataTypeMeta]),
) as Record<DataType, DataTypeMeta>
