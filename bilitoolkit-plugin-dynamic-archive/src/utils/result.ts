import type { ArchiveTaskResult } from '../types/index.js'
import { inArray, getFormattedDateTime } from '@ybgnb/utils'
import type { TaskResultAction } from 'bilitoolkit-types'

export function parseResultHtmlAndActions({ dynamics }: ArchiveTaskResult) {
  const html: string[] = []
  const actions: TaskResultAction[] = []

  for (const dynamic of dynamics) {
    if (!inArray(dynamic.type, ['DYNAMIC_TYPE_DRAW', 'DYNAMIC_TYPE_WORD'])) continue

    const opus = dynamic.modules.module_dynamic.major?.opus

    if (!opus) continue

    const dynamicContent: string[] = []
    const jump_url = `https:${opus.jump_url}`
    const {
      title,
      summary: { text },
    } = opus
    const pics = opus.pics ?? []

    const linkActionId = crypto.randomUUID()
    actions.push({
      actionId: linkActionId,
      type: 'link',
      url: jump_url,
    })
    const imgPreviewActionId = crypto.randomUUID()
    if (pics.length > 0) {
      actions.push({
        actionId: imgPreviewActionId,
        type: 'image-preview',
        srcList: pics.map((p) => p.url),
      })
    }

    const { face, name, pub_ts } = dynamic.modules.module_author
    const pubTime = getFormattedDateTime(new Date(Number(pub_ts) * 1000))

    dynamicContent.push(
      `<div style="display: flex;align-items: center;gap: 14px;padding-bottom: 10px;">` +
        `<img src="${face}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;" alt=""/>` +
        `<div style="display:flex;flex-direction:column;">` +
        `<div style="font-size: 17px;font-weight: 600;line-height: 24px;">${name}</div>` +
        `<div style="font-size: 13px;line-height: 18px;padding-top: 2px;color:var(--el-text-color-secondary);">${pubTime}</div>` +
        `</div>` +
        `</div>`,
    )

    if (title) {
      dynamicContent.push(`<div style="font-size: 15px;font-weight: 700;">${escapeHtml(title)}</div>`)
    }
    dynamicContent.push(`<div style="font-size: 15px;font-weight: 400;line-height: 25px;">${escapeHtml(text)}</div>`)

    if (pics) {
      if (pics.length === 1) {
        const pic = pics[0]
        const scale = 560 / Math.max(pic.width, pic.height)
        const w = Math.round(pic.width * scale)
        const h = Math.round(pic.height * scale)

        dynamicContent.push(
          `<div data-action-type="image-preview" data-action-id="${imgPreviewActionId}" data-index="0" style="width: ${Math.floor(w / 2)}px;height: ${Math.floor(h / 2)}px;" >` +
            `<img src="${pic.url}@${w}w_${h}h_1e_1c.avif" style="max-height: 100%; max-width: 100%;object-fit:contain;border-radius: 6px;" alt=""/>` +
            `</div>`,
        )
      } else {
        const imgList: string[] = []

        const maxCount = Math.min(pics.length, 9)

        for (let i = 0; i < maxCount; i++) {
          const pic = pics[i]
          const imgStyle = `height:100%;width:100%;object-fit:contain;border-radius: 6px;`
          if (i === 8 && pics.length > 9) {
            imgList.push(
              `<div data-index="${i}" style="height:132px;width:132px;position:relative;overflow:hidden;">` +
                `<img src="${pic.url}@264w_264h_1e_1c.avif" style="${imgStyle}" alt=""/>` +
                `<div style="position:absolute;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;color:#fff;font-size:36px;">+</div>` +
                `</div>`,
            )
          } else {
            imgList.push(
              `<div data-index="${i}" style="height:132px;width:132px;">` +
                `<img src="${pic.url}@264w_264h_1e_1c.avif" style="${imgStyle}" alt=""/>` +
                `</div>`,
            )
          }
        }

        dynamicContent.push(
          `<div data-action-type="image-preview" data-action-id="${imgPreviewActionId}" style="display:grid;grid-template-columns:repeat(3,132px);gap:4px;cursor: pointer;">${imgList.join('')}</div>`,
        )
      }
    }

    html.push(
      `<div data-action-type="link" data-action-id="${linkActionId}" style="border-radius: 6px; border: 1px solid var(--el-border-color);padding: 14px;">${dynamicContent.join('')}</div>`,
    )
  }

  return {
    details: `<div style="display: flex;flex-direction: column; gap: 20px;">${html.join('')}</div>`,
    actions,
  }
}

function escapeHtml(str: string) {
  if (!str) return ''
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  return String(str).replace(/[&<>"'/]/g, function (s: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (map as any)[s]
  })
}
