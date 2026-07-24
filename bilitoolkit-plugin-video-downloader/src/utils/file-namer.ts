import type { FileNamingData, FileNamerSettings } from '@/types/file-namer'
import { FileNamer, baseFileNamingFieldMap, type BaseFileNamingField } from '@ybgnb/file-naming'
import { fileNamerFields } from '@/constants/file-namer'
import type { DownloadResourceType } from 'bilitoolkit-types'

export function createFileNamer({ fields, extendedFormats }: FileNamerSettings) {
  return new FileNamer<FileNamingData>({
    fields: fields.map((field) => {
      if (field in baseFileNamingFieldMap) {
        return field as BaseFileNamingField
      }
      return fileNamerFields[field as keyof typeof fileNamerFields]
    }),
    extendedFormats,
  })
}

export const parseFileName = (data: FileNamingData, context: FileNamerSettings | FileNamer) => {
  let fileNamer: FileNamer<FileNamingData>
  if (context instanceof FileNamer) {
    fileNamer = context
  } else {
    const { fields, extendedFormats } = context
    fileNamer = createFileNamer({ fields, extendedFormats })
  }

  return fileNamer.resolve(data)
}

export const getImgFileSuffix = (url: string) => {
  const index = url.lastIndexOf('.')
  return index > -1 ? url.slice(index) : '.jpg'
}

export const parseFullFileName = (
  data: FileNamingData,
  type: DownloadResourceType,
  context: FileNamerSettings | FileNamer,
) => {
  const result = parseFileName(data, context)
  let suffix: string
  switch (type) {
    case 'audio':
      suffix = '.aac'
      break
    case 'video':
      suffix = '.mp4'
      break
    case 'dm':
      suffix = '.danmaku.json'
      break
    case 'subtitle':
      suffix = '.subtitle.json'
      break
    case 'cover':
      suffix = getImgFileSuffix(data.video.pic)
      break
  }
  result.relativePath = result.relativePath + suffix
  result.segments[result.segments.length - 1] = result.segments[result.segments.length - 1] + suffix
  return result
}
