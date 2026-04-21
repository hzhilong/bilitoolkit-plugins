import type { UserTaskResult } from '../types'
import { getFormattedDateTime } from '@ybgnb/utils'

/**
 * 将用户任务运行结果转换为 HTML 格式
 * @param userTaskResult 用户任务结果对象
 * @returns HTML 字符串
 */
export function resultToHtml(userTaskResult: UserTaskResult): string {
  const { user, results, runAt } = userTaskResult

  const totalExp = results.reduce((sum, r) => sum + (r.exp || 0), 0)
  const successCount = results.filter((r) => r.success).length
  const failCount = results.length - successCount

  // 转义用户信息（防 XSS）
  const userName = escapeHtml(user.name || user.nickname || '')
  const userUid = escapeHtml(user.uid || '')
  const userFace = user.face || 'http://i0.hdslb.com/bfs/face/member/noface.jpg'

  // 生成任务列表 HTML（内联样式）
  const tasksHtml = results
    .map((result) => {
      const type = escape(result.type)
      const exp = result.exp !== undefined ? `+${result.exp}` : ''
      const statusIcon = result.success ? '✔' : '×'
      const statusColor = result.success ? '#10b981' : '#ef4444'
      return `
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
        <div style="flex: 1; font-weight: 500; color: #1f2937;">${type}</div>
        <div style="font-weight: 600; color: #fb7299; margin-right: 12px;">${exp}</div>
        <div style="color: ${statusColor}; font-size: 1.4rem; font-weight: bold;">${statusIcon}</div>
      </div>
    `
    })
    .join('')

  // 完整卡片（内联样式）
  return `
    <div style="min-width: 340px; max-width: 500px; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; font-size: 14px; border-radius: 1.2em; border: 2px solid #e5e7eb; overflow: hidden; background: white;">
      <!-- 用户信息区域 -->
      <div style="background: linear-gradient(135deg, #fb7299 0%, #ff9a6e 100%); padding: 16px; display: flex; align-items: center; gap: 12px;">
        <img src="${userFace}" style="width: 38px; height: 38px; border-radius: 50%; border: 2px solid white; object-fit: cover;" alt="头像" onerror="this.style.display='none'">
        <div style="flex: 1;">
          <div style="font-size: 1.4rem; font-weight: bold; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.1);">${userName}</div>
          <div style="color: rgba(255,255,255,0.8); font-size: 0.85rem; margin-top: 4px;">uid ${userUid}</div>
        </div>
        <div style="background: rgba(255,255,255,0.2); backdrop-filter: blur(4px); padding: 6px 16px; border-radius: 2em; color: #ffeb3b; font-weight: bold;">经验 +${totalExp}</div>
      </div>

      <!-- 任务列表 -->
      <div style="padding: 8px 16px;">
        ${tasksHtml}
      </div>

      <!-- 底部统计 -->
      <div style="background: #f9fafb; padding: 12px 20px; text-align: center; font-size: 0.75rem; color: #6b7280; border-top: 1px solid #e5e7eb;">
        任务执行时间：${getFormattedDateTime(runAt)} | 成功${successCount}项 / 失败${failCount}项
      </div>
    </div>
  `
}

/**
 * 简单的 HTML 转义，防止 XSS
 */
function escapeHtml(str: unknown): string {
  if (str == null) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
