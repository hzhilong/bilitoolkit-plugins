import type { VideoId } from '@ybgnb/bili-api'

export const parseVideoId = async (url?: string): Promise<VideoId> => {
  url = url?.trim()
  if (!url) throw new Error('视频链接解析错误')

  if (url.length === 12 && url.match(/^BV1[0-9a-zA-Z]{9}$/)) {
    return {
      bvid: url,
    }
  }

  if (url.match(/^av[0-9]+$/)) {
    return {
      aid: Number(url.slice(2)),
    }
  }
  let match = url.match(/^https:\/\/b23.tv\/([0-9a-z-A-Z]+)$/)
  if (match) {
    return parseVideoId((await fetch(url)).url)
  }

  match = url.match(/https:\/\/www.bilibili.com\/video\/([^/?]+)/)
  return parseVideoId(match ? match[1] : undefined)
}
