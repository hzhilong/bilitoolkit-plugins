import type { OpusDetail } from '@ybgnb/bili-api'
import { dayjs } from 'element-plus'
import { parseOpusTitle, parseOpusDyId, parseOpusAuthor } from '../parse'
import type { OptContext } from '@/types/context'
import { createAbortError, getFileNameWithoutExtension, getFileName } from '@ybgnb/utils'
import { toolkitApi } from 'bilitoolkit-ui'
import { processMarkdownImages, fetchImageWithExtension } from '../image'
import { OpusMdConverter } from './md-convert'
import type { ResolveFilePathResult } from '@ybgnb/file-naming'

function prependSourceInfo(content: string, opusDetail: OpusDetail): string {
  const sourceBlock: string[] = []

  sourceBlock.push(`> 原标题：${parseOpusTitle(opusDetail)}`)
  sourceBlock.push(`> 原文链接：<https://www.bilibili.com/opus/${parseOpusDyId(opusDetail)}>`)

  const author = parseOpusAuthor(opusDetail)
  if (author) {
    sourceBlock.push(`> 作者：${author.name}（UID: ${author.mid}）`)
    sourceBlock.push(`> 发布日期：${dayjs.unix(Number(author.pub_ts)).format('YYYY-MM-DD HH-mm-ss')}`)
  }

  return sourceBlock.join('\n') + '\n\n' + content
}

export async function opusHtml2Markdown(
  context: OptContext,
  opusDetail: OpusDetail,
  opusHtml: string,
  fileNamingResult: ResolveFilePathResult,
) {
  const { signal, appSettings } = context
  const { relativePath: mdFilePathWithoutExtension, fileName: mdFileNameWithoutExtension } = fileNamingResult

  const parser = new DOMParser()
  const opusDoc = parser.parseFromString(opusHtml, 'text/html')
  const opusDetailEl = opusDoc.querySelector('.opus-module-content')
  if (!opusDetailEl) {
    throw new Error('专栏不存在')
  }

  if (signal.aborted) {
    throw createAbortError()
  }

  const rawMd = await new OpusMdConverter(appSettings.turndownOptions).convert(opusDetailEl)

  const cache = new Map<string, number>()
  let resolvedMd = await processMarkdownImages(rawMd, context.appSettings.mdLocalImages, async (url: string) => {
    const { content, extension } = await fetchImageWithExtension(url)
    let imgFileName = getFileNameWithoutExtension(getFileName(url).split('?')[0].split('#')[0].split('@')[0])
    if (cache.has(imgFileName)) {
      const index = cache.get(imgFileName)! + 1
      cache.set(imgFileName, index)
      imgFileName = `${imgFileName}-${index}`
    } else {
      cache.set(imgFileName, 1)
    }
    if (context.appSettings.mdLocalImages) {
      await toolkitApi.file.write(`${mdFilePathWithoutExtension}.assets/${imgFileName}${extension}`, content, true)
    }
    return `./${mdFileNameWithoutExtension}.assets/${imgFileName}${extension}`
  })

  if (context.appSettings.mdPrependAttribution) {
    resolvedMd = prependSourceInfo(resolvedMd, opusDetail)
  }
  return { rawMd, resolvedMd }
}
