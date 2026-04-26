import { BiliClient, type DailyTaskStatus } from '@ybgnb/bili-api'

const listMap = new Map<number, DailyTaskStatus>()
/**
 * 日常任务状态的存储实例
 */
export const dailyTaskStatusStore = {
  get: async (client: BiliClient, signal?: AbortSignal | undefined) => {
    const uid = client.config.context?.userCookie.uid
    if (uid === undefined) throw new Error('内部错误，uid 为空')
    if (listMap.has(uid)) return listMap.get(uid)!
    const dailyTaskStatus = await client.userExp.getDailyTaskStatus({ signal })
    listMap.set(uid, dailyTaskStatus)
    return dailyTaskStatus
  },
}
