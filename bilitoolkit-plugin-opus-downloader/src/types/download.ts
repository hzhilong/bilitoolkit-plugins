import type { OpusDetail } from '@ybgnb/bili-api'

export const downloadResourceTypeMap = {
  md: 'markdown',
  docx: 'docx',
  txt: 'txt',
}

export type DownloadResourceType = keyof typeof downloadResourceTypeMap

export interface DownloadResult {
  opus: OpusDetail
  fileList: Array<ResourceFile>
}

export interface ResourceFile {
  type: DownloadResourceType
  filePath: string
}
