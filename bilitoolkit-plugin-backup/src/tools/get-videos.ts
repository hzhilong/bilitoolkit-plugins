import { toValue } from 'vue'
import { assertUserLoggedIn } from '@/utils/assert'
import { ElMessageBox } from 'element-plus'
import { createBiliClient } from 'bilitoolkit-runtime/biliapi'
import type { ToolContext } from '@/types/tools'
import { Tool } from '@/tools/index'

export class GetVideosTool extends Tool {
  title: string = '已注销账号的投稿'
  desc: string = '查询已注销账号的投稿视频'
  async executor({ user, signal, log }: ToolContext) {
    const userInfo = toValue(user)
    assertUserLoggedIn(userInfo)

    const client = await createBiliClient(userInfo)

    const { value: sourceUid } = await ElMessageBox.prompt('请输入已注销账号的用户 uid', '提示', {
      confirmButtonText: '下一步',
      cancelButtonText: '取消',
      inputPattern: /^[0-9]+$/,
      inputErrorMessage: '无效 uid',
    })

    log(`正在获取用户 [${sourceUid}] 的投稿视频`)
    const { list } = await client.spaceVideo.fetchAll(
      {
        mid: Number(sourceUid),
      },
      undefined,
      undefined,
      {
        signal: signal,
      },
    )

    log(`已获取 ${list.vlist.length} 个投稿视频`)
    for (let i = 0; i < list.vlist.length; i++) {
      const v = list.vlist[i]
      log(`${i + 1}/${list.vlist.length}  ${v.bvid}  ${v.title}`)
    }
  }
}
