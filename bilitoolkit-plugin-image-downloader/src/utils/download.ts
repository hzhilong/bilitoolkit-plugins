import { toolkitApi, showToast } from 'bilitoolkit-ui'
import { sleepRandom } from '@ybgnb/utils'
import type { ImageElInfo } from '@/types/types'

function toSafeFilename(text?: string, maxLength = 255) {
  if (!text) return text
  const illegal = /[<>:"/\\|?*]/g
  let safe = text.replace(illegal, '_')
  safe = safe.replace(/[\x00-\x1f\x7f]/g, '').trim()
  safe = safe.replace(/[. ]$/, '_')
  return safe.slice(0, maxLength)
}

export const getFileSuffix = (url: string) => {
  const index = url.lastIndexOf('.')
  return index > -1 ? url.slice(index) : 'png'
}

export const getFileName = (url: string) => {
  try {
    const path = new URL(url).pathname
    const last = path.split('/').pop()
    if (!last) return ''
    const dotIndex = last.lastIndexOf('.')
    return dotIndex > 0 ? last.slice(0, dotIndex) : last
  } catch {
    return crypto.randomUUID()
  }
}

export const buildPath = (...parts: (string | undefined)[]) =>
  parts
    .filter((p) => !!p)
    .join('/')
    .replace(/\/+/g, '/')

export const downloadImages = async (images: ImageElInfo[]) => {
  if (!images || images.length === 0) return

  const root = await toolkitApi.file.getRootDir()
  let firstFilePath: null | string = null

  for (const { complete, url, fileName } of images) {
    const response = await fetch(url)
    const buffer = await response.arrayBuffer()
    const fileContent = new Uint8Array(buffer)
    const paths = fileName.split('/')
    let filePath
    if (paths.length === 1) {
      filePath = buildPath(root, toSafeFilename(`${fileName}${getFileSuffix(url)}`))
    } else {
      filePath = buildPath(
        root,
        ...paths.slice(0, -1),
        toSafeFilename(`${paths[paths.length - 1]}${getFileSuffix(url)}`),
      )
    }
    await toolkitApi.file.write(filePath, fileContent)

    if (!complete) {
      await sleepRandom(500, 777)
    }

    if (!firstFilePath) {
      firstFilePath = filePath
    }
  }
  await toolkitApi.system.showItemInFolder(firstFilePath!)
  showToast('保存成功')
}
