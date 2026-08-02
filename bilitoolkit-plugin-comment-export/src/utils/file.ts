import type { ContentWithComment, ContentType } from '@/types'
import { formatFileTimestamp } from '@ybgnb/utils'
import { toolkitApi } from 'bilitoolkit-ui'
import type { VideoInfo } from '@ybgnb/bili-api'
import { defaultSanitizePathSegment } from '@ybgnb/file-naming'

export const exportContentWithComment = async (contentType: ContentType, data: ContentWithComment) => {
  const {
    source: { oid },
  } = data
  let fileName
  switch (contentType) {
    case '视频':
      const video = data.content as VideoInfo
      fileName = defaultSanitizePathSegment(
        `${contentType}【${video.title}】${video.bvid} 评论 ${formatFileTimestamp()}.json`,
      )
      break
    default:
      fileName = `${contentType}【${oid}】评论 ${formatFileTimestamp()}.json`
  }

  const filePath = `${contentType} 评论导出/${fileName}`
  const bytes = new TextEncoder().encode(JSON.stringify(data, null, 2))
  const chunkSize = 1024 * 1024
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize)
    await toolkitApi.file.writeChunk(filePath, chunk, i)
  }
  if (toolkitApi.system.showItemInPluginFolder != null) {
    await toolkitApi.system.showItemInPluginFolder(filePath)
  } else {
    await toolkitApi.system.showItemInFolder(
      [await toolkitApi.file.getRootDir(), filePath].join('/').replace(/\/+/g, '/'),
    )
  }
  return filePath
}

export const importContentWithComment = async (fileContent: string) => {
  return JSON.parse(fileContent) as ContentWithComment
}
