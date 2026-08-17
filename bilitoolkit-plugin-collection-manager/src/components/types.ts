import type { MyArchiveWithSeason, MySeasonItem } from '@/types'
import type { BiliClient } from '@ybgnb/bili-api'

export interface SaveDataModalProps {
  oldMyArchives: MyArchiveWithSeason[]
  myArchives: MyArchiveWithSeason[]
  oldMySeasons: MySeasonItem[]
  mySeasons: MySeasonItem[]
  client: BiliClient | undefined
}
