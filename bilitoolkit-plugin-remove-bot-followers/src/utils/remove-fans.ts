import { type Relation, type UserInfoWithCookie } from '@ybgnb/bili-api'
import { loadingDialog } from 'bilitoolkit-ui'
import { sleepRandom, createAbortError } from '@ybgnb/utils'
import { createBiliClient } from 'bilitoolkit-runtime/biliapi'

export const removeFans = async (
  fans: Relation[],
  block: boolean,
  context: {
    user: UserInfoWithCookie
  },
) => {
  try {
    const client = await createBiliClient(context.user)
    const abortController = new AbortController()
    const signal = abortController.signal
    const onCancel = () => abortController.abort()

    const actionName = block ? '正在移除并拉黑粉丝 ' : '正在移除粉丝 '

    for (let i = 0; i < fans.length; i++) {
      if (signal.aborted) throw createAbortError()
      const fan = fans[i]
      loadingDialog.show({
        message: `${i + 1}/${fans.length} ${actionName} [${fan.uname}]`,
        showCancel: true,
        onCancel,
      })
      if (block) {
        await sleepRandom(1111, 1666)
        await client.relation.blockUser(fan.mid, { signal })
      } else {
        await sleepRandom(1111, 1666)
        await client.relation.removeFan(fan.mid, { signal })
      }
    }
  } finally {
    loadingDialog.close()
  }
}
