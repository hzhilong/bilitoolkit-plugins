import { Tool } from '@/tools/index'
import type { ToolContext } from '@/types/tools'
import { createBiliClient } from 'bilitoolkit-runtime/biliapi'
import { toValue } from 'vue'
import { assertUserLoggedIn } from '@/utils/assert'
import { RelationAttributeMap, type UserCardData, type BiliClient } from '@ybgnb/bili-api'
import { apiSleep } from '@/core/utils/sleep'
import { sleepRandom } from '@ybgnb/utils'

export class RemoveBotFansTool extends Tool {
  title: string = '移除机器人粉丝'
  desc: string = '2025.4 后出现大量机器人粉丝，据传被关注后可能导致账号遭到举报/警告/封禁'
  async executor({ user, signal, log }: ToolContext) {
    const userInfo = toValue(user)
    assertUserLoggedIn(userInfo)

    const client = await createBiliClient(userInfo)

    log('正在获取粉丝列表')
    const fans = await client.relation.fetchFansAll(undefined, undefined, undefined, {
      signal,
    })
    log(`已获取 ${fans.length} 个粉丝`)

    let removeCount = 0
    for (let i = 0; i < fans.length; i++) {
      const fan = fans[i]
      log(`----------------------------`)
      log(`正在处理 [${fan.uname}](${fan.mid})`)

      if (fan.attribute === RelationAttributeMap.Mutual) {
        log('跳过  已互相关注')
        continue
      }

      log(`正在获取用户的名片信息`)
      await apiSleep(signal)
      const userCardData = await client.user.getUserCard(
        { mid: fan.mid },
        {
          signal,
        },
      )

      if (userCardData.card.level_info.current_level > 2) {
        log('跳过  等级 > 2')
        continue
      }
      const score = await this.calcScamScore(userCardData, client, log, signal)
      if (score <= 10) {
        log(`可疑度：${score}，不是机器人`)
      } else {
        log(`可疑度：${score}，是机器人，正在移除`)
        await apiSleep(signal)
        await client.relation.removeFan(fan.mid, { signal })
        log(`成功移除该粉丝`)
        removeCount++
      }
    }
    log(`==================`)
    if (removeCount) {
      log(`成功移除 ${removeCount} 个机器人粉丝`)
    } else {
      log(`暂未发现机器人粉丝`)
    }
  }

  calcAttentionScamScore(attention: number): number {
    if (attention <= 100) return 0
    const b = 9.3024
    const c = 1179.05
    return Math.floor(b * (Math.exp((attention - 100) / c) - 1))
  }

  async calcScamScore(cardData: UserCardData, client: BiliClient, log: (msg: string) => void, signal?: AbortSignal) {
    const { card } = cardData
    const { current_level: level } = card.level_info

    let score = 0
    let msg = `${level}级  ${card.friend}关注  ${card.fans}粉丝`
    score += (2 - level) * 5
    score += this.calcAttentionScamScore(card.attention)
    score -= Math.floor(card.fans / 100) // 整数除法

    // 大会员判断
    if (card.vip.vipType !== 0) {
      msg += '  大会员'
      score -= 10
    } else {
      msg += '  非会员'
    }

    // 挂件判断
    if (card.pendant.pid !== 0) {
      msg += '  有挂件'
      score -= 10
    } else {
      msg += '  无挂件'
    }

    // 勋章判断
    if (card.nameplate.nid !== 0) {
      msg += '  有勋章'
      score -= 5
    } else {
      msg += '  无勋章'
    }

    // 封禁状态
    if (card.spacesta !== 0) {
      msg += '  已被封禁'
      score -= card.spacesta * 10
    }

    log('正在获取用户空间状态数')
    await sleepRandom(200, 400)
    const navNum = await client.spaceStatus.getNavNum(Number(card.mid), { signal })
    const posNum = navNum.video + navNum.article + navNum.album + navNum.audio + navNum.pugv
    msg += `  ${posNum}投稿  ${navNum.bangumi + navNum.cinema}追番追剧  ${navNum.channel.guest}视频列表  ${navNum.favourite.guest}收藏夹  ${navNum.opus}动态`

    score -= posNum * 5
    score -= navNum.bangumi * 2
    score -= navNum.cinema * 2
    score -= navNum.channel.guest * 5
    score -= navNum.favourite.guest * 5
    score -= navNum.opus * 5

    log(`` + msg)
    return score
  }
}
