import { fileNamerFields } from '@/constants/file-namer'
import type { ResourceFile } from '@/types/download'
import type { FileNamerSettings } from '@/types/file-namer'
import type { OpusDetail } from '@ybgnb/bili-api'
import {
  FileNamer,
  baseFileNamingFieldMap,
  type BaseFileNamingField,
  type ResolveFilePathResult,
} from '@ybgnb/file-naming'
import { toolkitApi } from 'bilitoolkit-ui'
import markdownToTxt from 'markdown-to-txt'
import { markdownToDocx } from './convert/docx-convert'

export function createFileNamer({ fields, extendedFormats }: FileNamerSettings) {
  return new FileNamer<OpusDetail>({
    fields: fields.map((field) => {
      if (field in baseFileNamingFieldMap) {
        return field as BaseFileNamingField
      }
      return fileNamerFields[field as keyof typeof fileNamerFields]
    }),
    extendedFormats,
  })
}

export async function saveMdFile(fileNamingResult: ResolveFilePathResult, md: string): Promise<ResourceFile> {
  const path = `${fileNamingResult.relativePath}.md`
  await toolkitApi.file.write(path, new TextEncoder().encode(md), true)
  return {
    type: 'md',
    filePath: path,
  }
}

export async function saveDocxFile(fileNamingResult: ResolveFilePathResult, md: string): Promise<ResourceFile> {
  const path = `${fileNamingResult.relativePath}.docx`
  await toolkitApi.file.write(path, await markdownToDocx(md), true)
  return {
    type: 'docx',
    filePath: path,
  }
}

export async function saveTxtFile(fileNamingResult: ResolveFilePathResult, md: string): Promise<ResourceFile> {
  const path = `${fileNamingResult.relativePath}.txt`
  await toolkitApi.file.write(path, new TextEncoder().encode(await markdownToTxt(md)), true)
  return {
    type: 'txt',
    filePath: path,
  }
}
