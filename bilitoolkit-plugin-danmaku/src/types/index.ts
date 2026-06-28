export interface User {
  mid: number
  uname: string
  face: string
}

export interface UserRankItem extends User {
  commentCount: number
  time: number
}

export interface UserQuery {
  name?: string
  uid?: number
}

export interface StatsHistory {
  id: number
  top3Desc: string
  time: number
}

export interface StatsHistoryItem extends UserRankItem {
  id: number
  historyId?: number
}

export interface StatsHistoryItemQuery {
  mid?: number
  historyId?: number
}

export interface Ranking {
  list: Array<UserRankItem>
  time: number
}
