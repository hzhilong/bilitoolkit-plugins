import { toValue } from 'vue'
import { assertUserLoggedIn } from '@/utils/assert'
import { createBiliClient } from 'bilitoolkit-runtime/biliapi'
import type { ToolContext } from '@/types/tools'
import { Tool } from '@/tools/index'
import { getErrorMessage } from '@ybgnb/utils'
import { inputUid } from '@/utils/tools'

export class GetFansTool extends Tool {
  title: string = '已注销账号的粉丝'
  desc: string = '查询已注销账号公开的粉丝，最多获取前100条数据。'
  async executor({ user, signal, log }: ToolContext) {
    const userInfo = toValue(user)
    assertUserLoggedIn(userInfo)

    const client = await createBiliClient(userInfo)

    const { value: sourceUid } = await inputUid('请输入已注销账号的用户 uid')

    try {
      log(`正在获取用户 [${sourceUid}] 的粉丝（只能获取他人前100条数据）`)
      const fans = await client.relation.fetchFansAll(Number(sourceUid), undefined, undefined, {
        signal: signal,
      })

      log(`已获取 ${fans.length} 个粉丝`)
      for (let i = 0; i < fans.length; i++) {
        const item = fans[i]
        log(`${i + 1}/${fans.length}  ${item.uname}  ${item.mid}`)
      }
    } catch (e) {
      log(getErrorMessage(e))
    }
  }
}
