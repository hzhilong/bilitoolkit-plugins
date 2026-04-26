import { BiliClient, type Dynamic } from '@ybgnb/bili-api'

const listMap = new Map<number, Dynamic[]>()
/**
 * 动态视频的存储实例
 */
export const dynamicStore = {
  get: async (client: BiliClient, signal?: AbortSignal | undefined) => {
    const uid = client.config.context?.userCookie.uid
    if (uid === undefined) throw new Error('内部错误，uid 为空')
    if (listMap.has(uid)) return listMap.get(uid)!
    const list: Dynamic[] = (await client.dynamic.fetchDynamicPage({ type: 'video' }, undefined, { signal })) ?? []
    listMap.set(uid, list)
    return list
  },
}
