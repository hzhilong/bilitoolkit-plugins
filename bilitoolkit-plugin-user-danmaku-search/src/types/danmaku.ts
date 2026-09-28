export interface QueryHistoryItem {
  uid: string
  name: string
  queriedAt: number
}

export interface WatchedChannel {
  uName: string
  uId: number
  faceUrl: string
  count: number
}

export interface DanmakuActor {
  uid: number
  name: string
}

export interface RoomEmoji {
  name: string
  resource: string
}

export interface DanmakuRecord {
  ts: number
  type: number
  actorId: number
  payloadKind: number
  payload?: {
    rawText?: string
    roomEmojiId?: number
    [key: string]: unknown
  }
}

export interface DanmakuSession {
  channel: {
    uId: number
    uName: string
    roomId: number
    faceUrl: string
    frameUrl: string
    title: string
  }
  live: {
    liveId: string
    parentArea: string
    area: string
    title: string
    startDate: number
    stopDate: number
    watchCount: number
    likeCount: number
    interactionCount: number
  }
  danmakus: {
    actors: DanmakuActor[]
    roomEmojis: RoomEmoji[]
    records: DanmakuRecord[]
  }
}

export interface HistoryPage {
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  items: DanmakuSession[]
}

export interface BootstrapData {
  history: HistoryPage
  historyUserNames?: string[]
  watchedChannels?: WatchedChannel[]
}

export interface BiliLiveRoomInfo {
  uid: number
  room_id: number
  short_id: number
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}
