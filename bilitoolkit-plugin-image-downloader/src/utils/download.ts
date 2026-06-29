import { toolkitApi, showToast } from 'bilitoolkit-ui'
import type { RichTextEmojiNode, Emote } from '@ybgnb/bili-api'
import { sleepRandom } from '@ybgnb/utils'

function toSafeFilename(text?: string, maxLength = 255) {
  if (!text) return text
  const illegal = /[<>:"/\\|?*]/g
  let safe = text.replace(illegal, '_')
  safe = safe.replace(/[\x00-\x1f\x7f]/g, '').trim()
  safe = safe.replace(/[. ]$/, '_')
  return safe.slice(0, maxLength)
}

export const buildPath = (...parts: (string | undefined)[]) =>
  parts
    .filter((p) => !!p)
    .join('/')
    .replace(/\/+/g, '/')

export const download = async (src: string, dir: string, fileName: string, openFolder: boolean = true) => {
  const response = await fetch(src)
  const buffer = await response.arrayBuffer()
  const fileContent = new Uint8Array(buffer)
  const root = await toolkitApi.file.getRootDir()
  const filePath = buildPath(root, dir, toSafeFilename(fileName))
  await toolkitApi.file.write(filePath, fileContent)
  if (openFolder) {
    await toolkitApi.system.showItemInFolder(filePath)
    showToast('保存成功')
  }
  return filePath
}

export const downloadCover = async (src: string, fileName: string) => {
  return download(src, 'cover', fileName)
}

export const downloadFace = async (src: string, fileName: string) => {
  return download(src, 'face', fileName)
}

export const getFileSuffix = (url: string) => {
  const path = url.split('?')[0]
  const match = path.match(/\.[^.]+$/)
  return match ? match[0] : ''
}

export const getFileName = (url: string) => {
  try {
    const path = new URL(url).pathname
    const last = path.split('/').pop()
    return last || ''
  } catch {
    return crypto.randomUUID()
  }
}

export const downloadDynamicEmojis = async (emojis: RichTextEmojiNode[], parentDir?: string) => {
  if (!emojis || emojis.length === 0) return

  const dir = buildPath('emoji', parentDir)
  let firstFilePath: null | string = null
  for (const { emoji } of emojis) {
    const filePath = await download(emoji.icon_url, dir, `${emoji.text}${getFileSuffix(emoji.icon_url)}`, false)
    await sleepRandom(500, 777)
    if (!firstFilePath) {
      firstFilePath = filePath
    }
  }
  await toolkitApi.system.showItemInFolder(firstFilePath!)
  showToast('保存成功')
}

export const downloadCommentEmojis = async (emojis: Emote[], parentDir?: string) => {
  if (!emojis || emojis.length === 0) return

  const dir = buildPath('emoji', parentDir)
  let firstFilePath: null | string = null
  for (const { text, url, gif_url } of emojis) {
    const filePath = await download(gif_url ?? url, dir, `${text}${getFileSuffix(gif_url ?? url)}`, false)
    await sleepRandom(500, 777)
    if (!firstFilePath) {
      firstFilePath = filePath
    }
  }
  await toolkitApi.system.showItemInFolder(firstFilePath!)
  showToast('保存成功')
}

export const downloadOpusPics = async (pics: string[], parentDir?: string) => {
  if (!pics || pics.length === 0) return

  const dir = buildPath('opus', toSafeFilename(parentDir))
  let firstFilePath: null | string = null
  for (const url of pics) {
    const filePath = await download(url, dir, getFileName(url), false)
    await sleepRandom(100, 333)
    if (!firstFilePath) {
      firstFilePath = filePath
    }
  }
  await toolkitApi.system.showItemInFolder(firstFilePath!)
  showToast('保存成功')
}
