import { apiSleep } from '@/core/utils/sleep'
import { Tool } from '@/tools/index'
import type { ToolContext } from '@/types/tools'
import { assertUserLoggedIn } from '@/utils/assert'
import { type Relation, BiliClient } from '@ybgnb/bili-api'
import { getErrorMessage } from '@ybgnb/utils'
import { showConfirm } from 'bilitoolkit-ui'
import { toValue } from 'vue'

export class RemoveCancelledFansTool extends Tool {
  title: string = '移除已注销的粉丝'
  desc: string = '移除粉丝列表中已注销的用户'

  async executor({ user, signal, log }: ToolContext) {
    const userInfo = toValue(user)
    assertUserLoggedIn(userInfo)

    //    const client = await createBiliClient(userInfo)
    const client = new BiliClient({
      context: {
        userCookie: userInfo.userCookie,
      },
    })

    log('正在获取粉丝列表')
    const allFans: Relation[] = []
    try {
      await client.relation.fetchFansAll(
        undefined,
        undefined,
        async (currList) => {
          allFans.push(...currList)
        },
        {
          signal,
        },
      )
    } catch (e) {
      if (allFans.length === 0) {
        throw e
      }
      log('任务中断：' + getErrorMessage(e))
    }
    log(`已获取 ${allFans.length} 个粉丝`)
    const cancelledFans = allFans.filter((r) => r.uname === '账号已注销')
    if (cancelledFans.length === 0) {
      log(`暂未发现已注销的粉丝`)
      return
    }
    log(`其中包含 ${cancelledFans.length} 个已注销的粉丝`)

    await showConfirm(`确定移除 ${cancelledFans.length} 个已注销的粉丝吗`)

    for (let i = 0; i < cancelledFans.length; i++) {
      const fan = cancelledFans[i]
      log(`----------------------------`)
      log(`正在处理 [${fan.uname}](${fan.mid})`)
      await apiSleep(signal)
      await client.relation.removeFan(fan.mid, { signal })
      log(`成功移除该粉丝`)
    }
    log(`==================`)
  }
}
