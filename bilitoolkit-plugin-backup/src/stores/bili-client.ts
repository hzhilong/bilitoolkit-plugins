import { toolkitApi } from 'bilitoolkit-ui'
import type { User } from '@/core/types/execute'

const allClient = new Map<number, string>()
/**
 * biliClient 的存储实例
 */
export const biliClientStore = {
  get: async (user?: User | null) => {
    if (!user || !user.mid) throw new Error('用户未登录')

    if (allClient.has(user.mid)) return allClient.get(user.mid)!

    const client = await toolkitApi.bili.createBiliClient({
      context: {
        userCookie: user.userCookie,
      },
    })

    if (!client) throw new Error('内部错误，创建 BiliClient 失败')

    allClient.set(user.mid, client.id)
    return client.id
  },
}
