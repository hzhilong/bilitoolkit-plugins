import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { visit } from 'unist-util-visit'
import type { Image, Root, Link } from 'mdast'
import { sleepRandom } from '@ybgnb/utils'
import { normalizeUrl } from '@/utils/url'

export type DownloadImage = (url: string) => Promise<string>

const imageExtensionsMap: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'image/avif': '.avif',
  'image/bmp': '.bmp',
  'image/x-icon': '.ico',
  'image/vnd.microsoft.icon': '.ico',
  'image/tiff': '.tiff',
}
const imageExtensions = Object.values(imageExtensionsMap)

export function ensureImageExtension(filename: string, defaultExt: string = 'jpg'): string {
  const temp = filename.split('.')
  const ext = temp[temp.length - 1].toLowerCase()
  if (ext && imageExtensions.includes(ext)) {
    return filename
  }
  return filename + '.' + defaultExt
}

export async function fetchImageWithExtension(url: string, signal?: AbortSignal) {
  const { contentType, data } = await fetchImageAsUint8(url, signal)

  const extension = contentType ? imageExtensionsMap[contentType] : undefined

  if (!extension) {
    throw new Error(`Unsupported image content type: ${contentType ?? 'unknown'}`)
  }

  return {
    content: new Uint8Array(data),
    extension,
  }
}

export async function fetchImageAsUint8(url: string, signal: AbortSignal | undefined) {
  const response = await fetch(url.startsWith('//') ? `https:${url}` : url, { signal })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()

  const contentType = response.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase()
  return { contentType, data: arrayBuffer }
}

export async function processMarkdownImages(
  markdown: string,
  isLocalImages: boolean,
  downloadImage: DownloadImage,
): Promise<string> {
  const tree = unified().use(remarkParse).parse(markdown) as Root

  const replacements: Array<{
    start: number
    end: number
    replacement: string
  }> = []

  const tasks: Promise<void>[] = []

  visit(tree, 'image', (node: Image) => {
    if (!node.position) {
      return
    }

    tasks.push(
      (async () => {
        let url = normalizeUrl(node.url)
        if (isLocalImages) {
          try {
            url = await downloadImage(url)
          } catch (e) {
            console.error(e)
          }
        }

        const original = markdown.slice(node.position!.start.offset, node.position!.end.offset)

        const replaced = replaceUrl(original, node.url, url)

        replacements.push({
          start: node.position!.start.offset!,
          end: node.position!.end.offset!,
          replacement: ` ${replaced}`,
        })
      })(),
    )
  })

  visit(tree, 'link', (node: Link) => {
    if (!node.position) {
      return
    }

    const url = normalizeUrl(node.url)

    if (url === node.url) {
      return
    }

    const original = markdown.slice(node.position.start.offset!, node.position.end.offset!)

    const replaced = replaceUrl(original, node.url, url)

    replacements.push({
      start: node.position.start.offset!,
      end: node.position.end.offset!,
      replacement: replaced,
    })
  })

  await tasks.reduce(
    (prev, task) =>
      prev.then(async () => {
        await sleepRandom(100, 300)
        await task
      }),
    Promise.resolve(),
  )

  // 从后往前替换，避免 offset 因前面的替换发生变化
  replacements.sort((a, b) => b.start - a.start)

  for (const item of replacements) {
    markdown = markdown.slice(0, item.start) + item.replacement + markdown.slice(item.end)
  }

  return markdown
}

function replaceUrl(markdownImage: string, oldUrl: string, newUrl: string): string {
  // 这里只处理 AST 已经确认是 image 的 Markdown，
  // 不负责判断它是不是图片，因此不需要自己解析 Markdown。
  const oldUrlEscaped = escapeRegExp(oldUrl)

  return markdownImage.replace(new RegExp(`(${oldUrlEscaped})`), newUrl)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
