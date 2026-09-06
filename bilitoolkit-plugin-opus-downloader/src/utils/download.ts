import type { OptContext } from '@/types/context'
import type { DownloadResult, ResourceFile } from '@/types/download'
import type { OpusDetail } from '@ybgnb/bili-api'
import { opusHtml2Markdown } from './convert/md-process'
import { saveDocxFile, saveMdFile, saveTxtFile } from './file'

export async function downloadOpus(context: OptContext, opusDetail: OpusDetail): Promise<DownloadResult> {
  const { client, signal } = context
  const opusHtml = await client.api.fetchText(
    `https://www.bilibili.com/opus/${opusDetail.item.id_str}?from=search&spm_id_from=333.337.0.0`,
    {
      signal,
    },
  )
  const fileNamingResult = context.fileNamer.resolve(opusDetail)

  const fileList: ResourceFile[] = []
  const { rawMd, resolvedMd } = await opusHtml2Markdown(context, opusDetail, opusHtml, fileNamingResult)

  if (context.appSettings.downloadResourceTypes.includes('md')) {
    fileList.push(await saveMdFile(fileNamingResult, resolvedMd))
  }

  if (context.appSettings.downloadResourceTypes.includes('docx')) {
    fileList.push(await saveDocxFile(fileNamingResult, rawMd))
  }

  if (context.appSettings.downloadResourceTypes.includes('txt')) {
    fileList.push(await saveTxtFile(fileNamingResult, resolvedMd))
  }

  return {
    opus: opusDetail,
    fileList,
  }
}
