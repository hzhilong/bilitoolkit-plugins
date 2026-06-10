import { toValue } from 'vue'
import { assertUserLoggedIn } from '@/utils/assert'
import { createBiliClient } from 'bilitoolkit-runtime/biliapi'
import type { ToolContext } from '@/types/tools'
import { Tool } from '@/tools/index'
import { getErrorMessage, isCanceledError } from '@ybgnb/utils'
import { showConfirm } from 'bilitoolkit-ui'
import { inputUid } from '@/utils/tools'
import { apiSleep } from '@/core/utils/sleep'

export class GetFollowingsTool extends Tool {
  title: string = '已注销账号的关注'
  desc: string = '查询已注销账号公开的关注，最多获取前100条数据。查询完成后可还原关注'
  async executor({ user, signal, log, appSettings }: ToolContext) {
    const userInfo = toValue(user)
    assertUserLoggedIn(userInfo)

    const client = await createBiliClient(userInfo)

    const { value: sourceUid } = await inputUid('请输入已注销账号的用户 uid')

    try {
      log(`正在获取用户 [${sourceUid}] 的关注（只能获取他人前100条数据）`)
      const followings = await client.relation.fetchFollowingsAll(Number(sourceUid), undefined, undefined, {
        signal: signal,
      })

      log(`已获取 ${followings.length} 个关注`)
      for (let i = 0; i < followings.length; i++) {
        const item = followings[i]
        log(`${i + 1}/${followings.length}  ${item.uname}  ${item.mid}`)
      }
      if (followings.length > 0) {
        await showConfirm(`是否还原以上${followings.length}个关注至当前用户[${toValue(user).name}]？`)

        for (let i = 0; i < followings.length; i++) {
          const following = followings[i]
          log(`正在关注用户 [${following.uname}]`)
          if (appSettings.avoidRiskControl) {
            log('避免风控中...')
            await client.relation.avoidRiskControl(following.mid, { signal })
            await apiSleep(signal)
          }
          try {
            await client.relation.followUser(following.mid, { signal })
            log(`成功关注用户 [${following.uname}]`)
          } catch (e) {
            const errorMessage = getErrorMessage(e)
            if (!errorMessage.includes('已经关注') && !errorMessage.includes('已注销')) {
              throw e
            }
            log(errorMessage)
          }
          await apiSleep(signal)
        }
      }
    } catch (e) {
      if (!isCanceledError(e)) log(getErrorMessage(e))
    }
  }
}
