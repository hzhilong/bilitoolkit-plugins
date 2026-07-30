import type { DanmakuElem, UserCard } from '@ybgnb/bili-api'

export interface DMItem
  extends Pick<
    DanmakuElem,
    'content' | 'progress' | 'mode' | 'fontsize' | 'color' | 'ctime' | 'pool' | 'midHash' | 'idStr' | 'weight'
  > {
  cracked?: boolean
  loading?: boolean
  uids: number[]
  users: Pick<UserCard, 'mid' | 'name' | 'face' | 'level'>[]
}

export interface DMXml {
  bvid: string
  title: string
  cid: number
  page: number
  part: string
  items: DMItem[]
}
