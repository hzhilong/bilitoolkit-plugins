import type { VideoInfo, VideoPart } from '@ybgnb/bili-api'
import type { VideoInfoSnapshot, VideoPartSnapshot } from 'bilitoolkit-types'
import { pick, omit } from 'lodash-es'

export const getVideoInfoSnapshot = (videoInfo: VideoInfo): VideoInfoSnapshot => {
  const base = pick(videoInfo, ['bvid', 'aid', 'tid', 'tid_v2', 'pic', 'title', 'pubdate', 'desc', 'duration', 'owner'])
  const stat = omit(videoInfo.stat, 'dislike')
  const snapshot: VideoInfoSnapshot = { ...base, stat }
  return snapshot
}

export const getVideoPartSnapshot = (videoPart: VideoPart): VideoPartSnapshot => {
  return pick(videoPart, ['cid', 'page', 'part', 'duration', 'first_frame'])
}
