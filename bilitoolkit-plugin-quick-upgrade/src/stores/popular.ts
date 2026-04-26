import { BiliClient, type VideoInfo } from '@ybgnb/bili-api'

const listMap = new Map<number, VideoInfo[]>()
/**
 * 热门视频的存储实例
 */
export const popularStore = {
  get: async (client: BiliClient, signal?: AbortSignal | undefined) => {
    const uid = client.config.context?.userCookie.uid
    if (uid === undefined) throw new Error('内部错误，uid 为空')
    if (listMap.has(uid)) return listMap.get(uid)!
    const list: VideoInfo[] = (await client.videoRanking.fetchPopularPage(undefined, { signal })) ?? []
    listMap.set(uid, list)
    return list
  },
}
