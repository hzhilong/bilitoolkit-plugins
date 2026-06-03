/**
 * 数据类型元数据
 */
export interface DataTypeMeta {
  type: string
  name: string
  backupDesc?: string
  restoreDesc?: string
  clearDesc?: string
}

/**
 * 所有的数据类型
 */
export const AllDataTypes = [
  {
    type: 'following',
    name: '关注',
    restoreDesc: '新号建议不要短时间内操作大量数据，如遇风控请使用 APP 手动关注/取消任一UP',
  },
  { type: 'follower', name: '粉丝' },
  {
    type: 'to_view',
    name: '稍后再看',
  },
  { type: 'black', name: '黑名单' },
  { type: 'favorites', name: '收藏夹', restoreDesc: '内容较多时，推荐使用【其他工具】中的【快速拷贝收藏夹】功能' },
  { type: 'fav_opuses', name: '收藏的专栏' },
  { type: 'bangumi_anime', name: '我的追番' },
  { type: 'bangumi_tv', name: '我的追剧' },
  { type: 'fav_collected', name: '收藏的视频合集' },
  { type: 'history', name: '历史记录' },
  {
    type: 'comment',
    name: '评论',
    clearDesc: '遍历被回复/被点赞的互动通知，删除其中能定位到的互动评论，并同时删除这些通知。',
  },
  {
    type: 'msg_reply',
    name: '通知(回复我的)',
    clearDesc: '请注意：清空后，无法再通过此类通知消息快速定位自己发布的评论。',
  },
  {
    type: 'msg_like',
    name: '通知(收到的赞)',
    clearDesc: '请注意：清空后，无法再通过此类通知消息快速定位自己发布的评论。',
  },
  {
    type: 'msg_at',
    name: '通知(@我的)',
  },
  {
    type: 'msg_sys',
    name: '系统通知',
  },
  {
    type: 'session',
    name: '私信',
  },
  {
    type: 'space_privacy',
    name: '空间隐私设置',
  },
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
