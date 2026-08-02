import type { Relation, UserInfo } from '@ybgnb/bili-api'
import { defaultSanitizePathSegment } from '@ybgnb/file-naming'
import { formatFileTimestamp } from '@ybgnb/utils'
import { toolkitApi } from 'bilitoolkit-ui'
import { AppError } from 'bilitoolkit-types'

export async function exportBlackList({ name }: UserInfo, list: Relation[]) {
  const fileName = defaultSanitizePathSegment(`${name} - 黑名单 - ${formatFileTimestamp()}.json`)
  const bytes = new TextEncoder().encode(JSON.stringify(list, null, 2))
  const chunkSize = 1024 * 1024
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize)
    await toolkitApi.file.writeChunk(fileName, chunk, i)
  }
  if (toolkitApi.system.showItemInPluginFolder != null) {
    await toolkitApi.system.showItemInPluginFolder(fileName)
  } else {
    await toolkitApi.system.showItemInFolder(
      [await toolkitApi.file.getRootDir(), fileName].join('/').replace(/\/+/g, '/'),
    )
  }
  return fileName
}

export const importBlackList = async (fileContent: string) => {
  const list = JSON.parse(fileContent) as Relation[]
  if (Array.isArray(list) && list.length > 0) {
    const item = list[0]
    if (item.mid != null) {
      return list
    }
  }
  throw new AppError('解析黑名单列表失败')
}
