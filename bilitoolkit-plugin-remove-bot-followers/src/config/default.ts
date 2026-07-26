import type { AppSettings } from '@/types'

export const defaultAppSettings: () => AppSettings = () => ({
  robotScoreRules: {
    bonusPerLevelAboveTwo: -10,
    attentionScoreStart: 100,
    fansScoreStart: 100,
    isVip: -10,
    hasPendant: -10,
    hasNameplate: -5,
    isBanned: 10,
    publicationScoreWeight: -5,
    bangumiScoreWeight: -2,
    favouriteScoreWeight: -5,
    dynamicScoreWeight: -5,
  },
  robotScoreThreshold: 10,
  skipLvGt2: true,
})
