import type { BiliClient, SeasonSection, PartEpisode, SeasonInfo, SeasonCheckinInfo, SeasonStat } from '@ybgnb/bili-api'

export interface AppSettings {
  cacheMyArchives: boolean
}

export interface MyArchive {
  aid: number
  bvid: string
  pubTime: number
  title: string
  firstCid: number
  uid: number
}

export interface MyArchiveWithSeason extends MyArchive {
  seasonId?: number
  sectionId?: number
  // 小节里的视频 id（只有旧MyArchiveWithSeason才有）
  episodeId?: number
}

export interface CacheState {
  uid: number
  lastTime: number
}

export type Logger = (msg: string) => void

export interface FetchDataContext {
  client: BiliClient
  signal?: AbortSignal
  useCache: boolean
  logger: Logger
  currUid: number
}

export interface MySeasonSection extends SeasonSection {
  archives: MyArchiveWithSeason[]
}

export interface MySeasonSections {
  /** 小节列表 */
  sections: MySeasonSection[]
}

export interface MySeasonItem {
  /** 合集信息 */
  season: SeasonInfo
  /** 审核信息 */
  checkin: SeasonCheckinInfo
  /** 合集统计信息 */
  seasonStat: SeasonStat
  /** 小节列表（套娃结构） */
  sections: MySeasonSections
  /** 合集视频列表，不全 */
  part_episodes: PartEpisode[] | null
}

export type AddSeason = Pick<SeasonInfo, 'title' | 'desc' | 'cover'>
export type UpdateSeason = Pick<SeasonInfo, 'title' | 'desc' | 'cover' | 'no_section' | 'forbid'>
