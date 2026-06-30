import type { RichTextNode, RichTextEmojiNode, RichTextViewPictureNode, RichTextPicture } from '@ybgnb/bili-api'
import type { ImageInfo } from '@/types/types'
import { getFileName } from '@/utils/download'

export const getEmojisFromRichText = (nodes: RichTextNode[], parentDir?: string): ImageInfo[] => {
  parentDir = parentDir ? `${parentDir}/` : ''
  return nodes
    .filter((r) => r.type === 'RICH_TEXT_NODE_TYPE_EMOJI')
    .map((r: RichTextEmojiNode) => ({
      url: r.emoji.gif_url ?? r.emoji.icon_url,
      fileName: `${parentDir}${r.emoji.text}`,
    }))
}

export const getPicsFromRichText = (nodes: RichTextNode[], parentDir?: string): ImageInfo[] => {
  parentDir = parentDir ? `${parentDir}/` : ''
  return nodes
    .filter((r) => r.type === 'RICH_TEXT_NODE_TYPE_VIEW_PICTURE')
    .map((r: RichTextViewPictureNode) => {
      return r.pics.map((p: RichTextPicture) => ({
        url: p.src,
        fileName: `${parentDir}/${getFileName(p.src)}`,
      }))
    })
    .flat()
}
