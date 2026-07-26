import type { Fans, AppSettings, RobotFans } from '@/types'
import { sleepRandom, chunk, createAbortError, sleep } from '@ybgnb/utils'
import { createBiliClient } from 'bilitoolkit-runtime/biliapi'
import {
  type UserCardData,
  type SpaceNavNum,
  type UserInfoWithCookie,
  type UserCard,
  RelationAttributeMap,
  type BiliClient,
} from '@ybgnb/bili-api'
import { showConfirm, loadingDialog } from 'bilitoolkit-ui'

function calcAttentionScamScore(attention: number, attentionScoreStart: number): number {
  if (attention <= attentionScoreStart) return 0
  const b = 9.3024
  const c = 1179.05
  return Math.floor(b * (Math.exp((attention - attentionScoreStart) / c) - 1))
}

export const calcRobotScore = async (
  client: BiliClient,
  fan: Fans,
  appSettings: AppSettings,
  context: {
    signal?: AbortSignal
  },
): Promise<number> => {
  const { mid, level } = fan
  const { robotScoreRules, skipLvGt2 } = appSettings
  const { signal } = context

  if (skipLvGt2 && level > 2) return 0

  let userCardData: UserCardData

  try {
    await sleepRandom(1111, 1666)
    userCardData = await client.user.getUserCard(
      { mid: mid },
      {
        signal,
      },
    )
  } catch (err) {
    console.error(`获取用户[${mid}]信息出错`, err)
    return 0
  }

  const { card } = userCardData
  let score = 0
  score += (level - 2) * robotScoreRules.bonusPerLevelAboveTwo
  score += calcAttentionScamScore(card.attention, robotScoreRules.attentionScoreStart)
  score += Math.floor(card.fans / robotScoreRules.fansScoreStart)

  // 大会员
  if (card.vip && card.vip.vipType !== 0) {
    score += robotScoreRules.isVip
  }

  // 挂件
  if (card.pendant.pid !== 0) {
    score += robotScoreRules.hasPendant
  }

  // 勋章
  if (card.nameplate.nid !== 0) {
    score += robotScoreRules.hasNameplate
  }

  // 封禁
  if (card.spacesta !== 0) {
    score += robotScoreRules.isBanned
  }

  let navNum: SpaceNavNum

  try {
    await sleepRandom(1111, 2233)
    navNum = await client.spaceStatus.getNavNum(mid, { signal })
  } catch (err) {
    console.error(`获取用户[${mid}]信息出错`, err)
    return score
  }

  const posNum = navNum.video + navNum.article + navNum.album + navNum.audio + navNum.pugv

  score += posNum * robotScoreRules.publicationScoreWeight
  score += navNum.bangumi * robotScoreRules.bangumiScoreWeight
  score += navNum.cinema * robotScoreRules.bangumiScoreWeight
  score += navNum.favourite.guest * robotScoreRules.favouriteScoreWeight
  score += navNum.opus * robotScoreRules.dynamicScoreWeight

  return score
}

export const getRobotFans = async (
  appSettings: AppSettings,
  context: {
    user: UserInfoWithCookie
  },
) => {
  try {
    const client = await createBiliClient(context.user)
    const abortController = new AbortController()
    const signal = abortController.signal
    const onCancel = () => abortController.abort()

    loadingDialog.show({
      message: '正在获取粉丝数',
      showCancel: true,
      onCancel,
    })
    const { follower } = await client.relation.getStat(context.user.mid)
    await sleepRandom(666, 1111)

    if (follower > 200) {
      loadingDialog.close()
      await showConfirm(`当前粉丝数为 ${follower}，数据较多，可能需要较长时间，是否继续？`)
    }

    loadingDialog.show({
      message: '正在获取粉丝数据',
      showCancel: true,
      onCancel,
    })
    const fans = (
      await client.relation.fetchFansAll(context.user.mid, undefined, undefined, {
        signal,
      })
    ).filter((fan) => {
      // 非互相关注
      return fan.attribute !== RelationAttributeMap.Mutual
    })

    const userCards: (UserCard | null)[] = []
    for (const chunkList of chunk(fans, 50)) {
      await sleepRandom(1111, 2233)
      userCards.push(
        ...(await client.user.getUserCards(
          chunkList.map((r) => r.mid),
          { signal },
        )),
      )
    }

    const fansWithCards = fans
      .map((fan) => {
        const userCard = userCards.find((card) => card != null && card.mid === fan.mid)
        if (!userCard) return null
        return {
          ...fan,
          ...userCard!,
        } as Fans
      })
      .filter((f) => f != null)

    const robots: RobotFans[] = []
    for (let i = 0; i < fansWithCards.length; i++) {
      if (signal.aborted) throw createAbortError()

      const fan = fansWithCards[i]
      loadingDialog.show({
        message: `${i + 1}/${fansWithCards.length} 正在判断粉丝 ${fan.uname}`,
        showCancel: true,
        onCancel,
      })
      await sleep(100)
      const robotScore = await calcRobotScore(client, fan, appSettings, { signal })
      if (robotScore > appSettings.robotScoreThreshold) {
        robots.push({
          ...fan,
          robotScore,
        })
      }
    }
    return robots
  } finally {
    loadingDialog.close()
  }
}
