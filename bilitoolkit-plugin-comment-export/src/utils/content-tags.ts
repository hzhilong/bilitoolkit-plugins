import type { ContentWithComment } from '@/types'
import type { VideoInfo, Dynamic, OpusDetail, OpusInfo } from '@ybgnb/bili-api'
import { getTotalCommentCount } from '@/utils/comment'

function truncateText(text: string, maxLength: number, placeholder: string = '...'): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + placeholder
}

export const parseContentTags = (data: ContentWithComment): [string, string][] => {
  let extraTags: [string, string][] = []
  const {
    source: { type },
    content,
    contentType,
  } = data
  if (type === 1) {
    const video = content as VideoInfo
    extraTags = [
      ['bvid', video.bvid],
      ['标题', truncateText(video.title, 10)],
      ['作者', video.owner.name],
    ]
  } else if (type === 17) {
    const dynamic = content as Dynamic
    const text =
      dynamic.modules.module_dynamic.desc?.text ??
      dynamic.modules.module_dynamic.major?.article?.title ??
      dynamic.modules.module_dynamic.major?.opus?.summary.text ??
      `${dynamic.basic.comment_id_str}`
    extraTags = [
      ['标题', truncateText(text, 10)],
      ['作者', dynamic.modules.module_author.name],
    ]
  } else if (type === 11 || type === 12) {
    if ('title' in content) {
      const opusInfo = content as OpusInfo
      extraTags = [
        ['标题', truncateText(opusInfo.title, 10)],
        ['作者', opusInfo.author_name],
      ]
    } else {
      const opusDetail = content as OpusDetail
      extraTags = [
        ['标题', truncateText(opusDetail.item.basic.title, 10)],
        ['作者 uid', String(opusDetail.item.basic.uid)],
      ]
    }
  }

  return [['类型', contentType], ...extraTags, ['评论', String(getTotalCommentCount(data))]]
}
