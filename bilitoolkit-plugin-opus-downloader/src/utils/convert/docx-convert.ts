import { convertMarkdownToArrayBuffer } from '@mohtasham/md-to-docx'
import { fetchImageAsUint8 } from '../image'
import { normalizeUrl } from '../url'

export async function markdownToDocx(markdown: string) {
  return new Uint8Array(
    await convertMarkdownToArrayBuffer(markdown, {
      imageHandling: {
        async resolve(source, { signal }) {
          try {
            return await fetchImageAsUint8(normalizeUrl(source), signal)
          } catch {
            return undefined
          }
        },
      },
    }),
  )
}
