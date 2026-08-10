import type { ArchiveTaskResult } from '../types/index.js'

/**
 * 渲染归档任务卡片 HTML（可用于 v-html）
 * @param result 归档任务结果数据
 * @returns HTML 字符串
 */
export function renderArchiveTaskCard(result: ArchiveTaskResult): string {
  // ---------- 工具函数 ----------
  /** 格式化日期：YYYY-MM-DD HH:mm:ss */
  const formatDate = (date: Date): string => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  }

  /** HTML 转义（防止 XSS） */
  const escapeHtml = (str: string): string => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    }
    return str.replace(/[&<>"']/g, (m) => map[m] ?? m)
  }

  // ---------- 数据准备 ----------
  const runAtStr = formatDate(new Date(result.runAt))
  const taskId = result.taskId
  const totalCount = result.totalMediaCount
  const folders = result.folder ?? []

  const hasData = folders.length > 0 && folders.some((f) => f.medias?.length > 0)

  // ---------- 构建列表 HTML ----------
  let listHtml = ''

  if (!hasData) {
    listHtml = `<div class="ac-empty">暂无视频数据</div>`
  } else {
    for (const folder of folders) {
      const medias = folder.medias ?? []
      if (medias.length === 0) continue

      const folderTitle = escapeHtml(folder.title)
      const folderMid = escapeHtml(String(folder.mid))

      let mediaItemsHtml = ''
      for (const media of medias) {
        const mediaTitle = escapeHtml(media.title)
        const bvid = escapeHtml(media.bvid)
        mediaItemsHtml += `
          <div class="ac-media-item">
            <span class="ac-media-dot"></span>
            <span class="ac-media-title">${mediaTitle}</span>
            <span class="ac-media-bvid">${bvid}</span>
          </div>
        `
      }

      listHtml += `
        <div class="ac-folder">
          <div class="ac-folder-title">
            <span class="ac-folder-icon">📁</span>
            ${folderTitle}
            <span class="ac-folder-mid">（${folderMid}）</span>
            <span class="ac-folder-count">${medias.length} 个视频</span>
          </div>
          <div class="ac-media-list">${mediaItemsHtml}</div>
        </div>
      `
    }
  }

  // ---------- 完整 HTML ----------
  return `
    <style>
      .ac-card {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        max-width: 820px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
        border: 1px solid #e8ecf0;
        overflow: hidden;
        transition: box-shadow 0.2s ease;
      }
      .ac-card:hover {
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
      }

      /* -------- 卡片头 -------- */
      .ac-card-header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px 24px;
        padding: 16px 24px;
        background: linear-gradient(135deg, #f7f9fc 0%, #f0f4f9 100%);
        border-bottom: 1px solid #e8ecf0;
      }
      .ac-header-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        color: #2c3e50;
      }
      .ac-header-item .ac-label {
        color: #7a8a9e;
        font-weight: 400;
        letter-spacing: 0.3px;
      }
      .ac-header-item .ac-value {
        font-weight: 600;
        color: #1a2634;
      }
      .ac-header-item .ac-value.ac-task-id {
        color: #4a7cf7;
        background: rgba(74, 124, 247, 0.10);
        padding: 0 10px;
        border-radius: 4px;
        font-family: "SF Mono", "Menlo", monospace;
      }
      .ac-header-item .ac-value.ac-total {
        color: #e9692c;
        background: rgba(233, 105, 44, 0.10);
        padding: 0 10px;
        border-radius: 4px;
        font-weight: 700;
      }
      .ac-header-divider {
        width: 1px;
        height: 20px;
        background: #dce1e8;
        flex-shrink: 0;
      }

      /* -------- 卡片体 -------- */
      .ac-card-body {
        padding: 20px 24px 24px;
      }

      /* -------- 空状态 -------- */
      .ac-empty {
        text-align: center;
        color: #a0b0c0;
        font-size: 15px;
        padding: 32px 0 16px;
        letter-spacing: 0.5px;
      }

      /* -------- 收藏夹 -------- */
      .ac-folder {
        margin-bottom: 16px;
        border-left: 3px solid #4a7cf7;
        padding-left: 16px;
        background: #fafcff;
        border-radius: 0 6px 6px 0;
        transition: background 0.15s ease;
      }
      .ac-folder:last-child {
        margin-bottom: 0;
      }
      .ac-folder:hover {
        background: #f5f9ff;
      }

      .ac-folder-title {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px 12px;
        padding: 8px 0 6px 0;
        font-size: 15px;
        font-weight: 600;
        color: #1a2634;
        border-bottom: 1px dashed #eef2f7;
      }
      .ac-folder-icon {
        font-size: 16px;
        line-height: 1;
      }
      .ac-folder-mid {
        font-size: 12px;
        font-weight: 400;
        color: #8a9aaa;
        background: #eef2f7;
        padding: 0 8px;
        border-radius: 3px;
        font-family: "SF Mono", "Menlo", monospace;
      }
      .ac-folder-count {
        font-size: 12px;
        font-weight: 400;
        color: #7a8a9e;
        background: #eef2f7;
        padding: 0 10px;
        border-radius: 10px;
        margin-left: auto;
        white-space: nowrap;
      }

      /* -------- 视频列表 -------- */
      .ac-media-list {
        padding: 4px 0 10px 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .ac-media-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 5px 8px 5px 4px;
        font-size: 14px;
        border-radius: 4px;
        transition: background 0.12s ease;
      }
      .ac-media-item:hover {
        background: #f0f6fe;
      }

      .ac-media-dot {
        flex-shrink: 0;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #b0c8e0;
        margin-right: 4px;
      }

      .ac-media-title {
        color: #2c3e50;
        font-weight: 500;
      }

      .ac-media-bvid {
        font-size: 12px;
        font-weight: 400;
        color: #8a9aaa;
        background: #f0f4f9;
        padding: 0 8px;
        border-radius: 3px;
        font-family: "SF Mono", "Menlo", monospace;
        letter-spacing: 0.2px;
        white-space: nowrap;
      }

      /* -------- 响应式 -------- */
      @media (max-width: 600px) {
        .ac-card-header {
          padding: 12px 16px;
          gap: 8px 16px;
        }
        .ac-header-item {
          font-size: 13px;
        }
        .ac-card-body {
          padding: 14px 16px 18px;
        }
        .ac-folder {
          padding-left: 12px;
        }
        .ac-folder-title {
          font-size: 14px;
        }
        .ac-media-item {
          font-size: 13px;
          padding: 4px 4px 4px 0;
        }
        .ac-media-bvid {
          font-size: 11px;
        }
        .ac-header-divider {
          display: none;
        }
      }
    </style>

    <div class="ac-card">
      <!-- 卡片头 -->
      <div class="ac-card-header">
        <span class="ac-header-item">
          <span class="ac-label">🕐 执行时间</span>
          <span class="ac-value">${runAtStr}</span>
        </span>
        <span class="ac-header-divider"></span>
        <span class="ac-header-item">
          <span class="ac-label">📋 任务 ID</span>
          <span class="ac-value ac-task-id">#${taskId}</span>
        </span>
        <span class="ac-header-divider"></span>
        <span class="ac-header-item">
          <span class="ac-label">🎬 视频总数</span>
          <span class="ac-value ac-total">${totalCount} 个</span>
        </span>
      </div>

      <!-- 卡片体 -->
      <div class="ac-card-body">
        ${listHtml}
      </div>
    </div>
  `
}
