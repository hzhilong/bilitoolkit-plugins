import type { Relation, UserCard } from '@ybgnb/bili-api'

export interface CommentSource {
  oid: string
  type: string | number
}

export interface CommentQuery {
  keyword?: string
  uid?: number
  maxCount?: number
  isFetchSub: boolean
  mode: string
}

export type Fans = Relation & UserCard

export interface RobotFans extends Fans {
  robotScore: number
}

export interface RobotScoreRule {
  key: string
  name: string
  desc?: string
}

export const robotScoreRules = [
  {
    key: 'bonusPerLevelAboveTwo',
    name: '等级超过2级后每多1级增加的分数',
    desc: '机器人基本是 lv2。',
  },
  {
    key: 'attentionScoreStart',
    name: '关注数起算值',
    desc: '当关注数达到该值后，开始增加机器人评分；关注数越高，提高的评分越多。',
  },
  {
    key: 'fansScoreStart',
    name: '粉丝数起算值',
    desc: '当粉丝数达到该值后，开始减少机器人评分；粉丝数越高，降低的评分越多。',
  },
  {
    key: 'isVip',
    name: '是会员',
  },
  {
    key: 'hasPendant',
    name: '有挂件',
  },
  {
    key: 'hasNameplate',
    name: '有勋章',
  },
  {
    key: 'isBanned',
    name: '已被封禁',
  },
  {
    key: 'publicationScoreWeight',
    name: '【投稿】加分权重',
    desc: '每个投稿（视频、专栏、图文、音频、课程）增加的机器人评分。',
  },
  {
    key: 'bangumiScoreWeight',
    name: '【追番追剧】加分权重',
    desc: '每个追番追剧增加的机器人评分。',
  },
  {
    key: 'favouriteScoreWeight',
    name: '【收藏视频】加分权重',
    desc: '每个收藏视频增加的机器人评分。',
  },
  {
    key: 'dynamicScoreWeight',
    name: '【动态】减分权重',
    desc: '每个动态增加的机器人评分。',
  },
] as const satisfies RobotScoreRule[]

export type RobotScoreRuleKey = (typeof robotScoreRules)[number]['key']

export interface AppSettings {
  robotScoreRules: Record<RobotScoreRuleKey, number>
  robotScoreThreshold: number
  skipLvGt2: boolean
}
