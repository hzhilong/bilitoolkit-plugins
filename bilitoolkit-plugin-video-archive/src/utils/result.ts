import type { ArchiveTaskResult } from '../types/index.js'
import { formatTime } from '@ybgnb/utils'

export function createArchiveTaskResultsHtml(archiveTaskResults: ArchiveTaskResult[]) {
  // ---------- 构建 HTML ----------
  let html = ''

  for (const result of archiveTaskResults) {
    const { user, taskId, videoTitles, runAt } = result

    // ---- 卡片容器 ----
    html +=
      '<div style="' +
      'background:#ffffff;' +
      'border-radius:8px;' +
      'box-shadow:0 2px 8px rgba(0,0,0,0.06);' +
      'padding:16px 20px;' +
      'margin-bottom:16px;' +
      'transition:box-shadow 0.2s;' +
      '">'

    // ---- 用户信息行 ----
    html +=
      '<div style="' +
      'display:flex;' +
      'align-items:center;' +
      'gap:12px;' +
      'padding-bottom:12px;' +
      'border-bottom:1px solid #f0f0f0;' +
      'flex-wrap:wrap;' +
      '">'

    // 头像
    html +=
      '<img src="' +
      escapeHtml(user.face) +
      '"' +
      ' alt="头像"' +
      ' style="' +
      'width:44px;' +
      'height:44px;' +
      'border-radius:50%;' +
      'object-fit:cover;' +
      'background:#e8e8e8;' +
      'flex-shrink:0;' +
      '"' +
      ' onerror="this.style.display=\'none\'"' +
      '>'

    // 用户名
    html +=
      '<span style="' +
      'font-size:16px;' +
      'font-weight:600;' +
      'color:#1f1f1f;' +
      '">' +
      escapeHtml(user.name) +
      '</span>'

    // UID
    html += '<span style="' + 'font-size:13px;' + 'color:#8c8c8c;' + '">' + user.mid + '</span>'

    // 任务ID (右侧)
    html +=
      '<span style="' +
      'font-size:12px;' +
      'color:#bfbfbf;' +
      'margin-left:auto;' +
      'white-space:nowrap;' +
      '">任务ID：' +
      taskId +
      '</span>'

    // 执行时间 (右侧)
    html +=
      '<span style="' +
      'font-size:12px;' +
      'color:#bfbfbf;' +
      'margin-left:auto;' +
      'white-space:nowrap;' +
      '">' +
      formatTime(runAt) +
      '</span>'

    html += '</div>' // 用户信息行结束

    // ---- 任务列表 ----
    html += '<div style="margin-top:12px;">'

    for (let i = 0; i < videoTitles.length; i++) {
      const videoTitle = videoTitles[i]
      const borderColor = '#52c41a'
      const bgColor = '#f6ffed'

      html +=
        '<div style="' +
        'display:flex;' +
        'align-items:center;' +
        'gap:8px;' +
        'padding:8px 12px;' +
        'margin-bottom:6px;' +
        'border-radius:4px;' +
        'background:' +
        bgColor +
        ';' +
        'border-left:3px solid ' +
        borderColor +
        ';' +
        'transition:background 0.15s;' +
        'flex-wrap:wrap;' +
        '">'

      // 任务 ID
      html += '<span style="' + 'font-size:12px;' + 'color:#8c8c8c;' + 'flex-shrink:0;' + '">#' + (i + 1) + '</span>'

      // 标题 (过长截断)
      html +=
        '<span style="' +
        'font-size:14px;' +
        'color:#1f1f1f;' +
        'flex:1;' +
        'min-width:60px;' +
        'white-space:nowrap;' +
        'overflow:hidden;' +
        'text-overflow:ellipsis;' +
        '">' +
        escapeHtml(videoTitle) +
        '</span>'

      html += '</div>' // 任务条目结束
    }

    html += '</div>' // 任务列表结束
    html += '</div>' // 卡片容器结束
  }

  // 如果没有任何数据，显示占位信息
  if (!html) {
    html = '<div style="text-align:center;padding:40px 0;color:#bfbfbf;font-size:14px;">暂无数据</div>'
  }

  return html
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
