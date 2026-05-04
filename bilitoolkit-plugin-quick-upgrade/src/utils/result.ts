import type { UserTaskResult } from '../types/index.js'
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

  // 转义用户信息
  const userName = escapeHtml(user.name || '')
  const userUid = escapeHtml(user.mid || '')
  const userFace = user.face || 'http://i0.hdslb.com/bfs/face/member/noface.jpg'

  if (results.length === 0) {
    results.push({
      type: '无可执行的任务',
      success: false,
      message: '',
      exp: 0,
    })
  }

  // 生成任务列表 HTML（内联样式）
  const tasksHtml = results
    .map((result, i) => {
      const type = result.type
      const exp = result.exp !== undefined ? `+${result.exp}` : ''
      const statusIcon = result.success ? '✔' : '×'
      const statusColor = result.success ? 'var(--app-success-color)' : 'var(--app-error-color)'
      return `
      <div style="display: flex;align-items: center;justify-content: space-between;padding: 4px 0;${i !== results.length - 1 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">
        <div style="flex: 1; font-weight: 500; color: var(--el-text-color-primary);font-size: 14px;">${type}</div>
        <div style="font-weight: 600; color: #fb7299; text-align: right;margin-right: 10px;">${exp}</div>
        <div style=" margin-right: 10px;text-align: center;font-size: 16px;color: ${statusColor};">${statusIcon}</div>
      </div>
    `
    })
    .join('')

  // 完整卡片（内联样式）
  return `
    <div style="min-width: 340px; max-width: 500px; font-size: 14px; border-radius: 14px; border: 2px solid var(--el-border-color); overflow: hidden; ">
      <!-- 用户信息区域 -->
      <div style="background: linear-gradient(135deg, var(--app-primary-color) -10%, var(--app-color-background) 200%); color: var(--app-color-background); padding: 16px; display: flex; align-items: center; gap: 8px;">
        <img src="${userFace}" style="width: 38px; height: 38px; border-radius: 50%; border: 2px solid var(--app-color-background); object-fit: cover;" alt="头像">
        <div style="flex: 1;">
          <div style="color: #ffffff;font-size: 16px; border-radius: 40px; backdrop-filter: blur(2px); text-shadow: var(--app-text-shadow); text-wrap: nowrap;">${userName}</div>
          <div style=" color: #f2f2f2; font-size: 14px;text-wrap: nowrap;">uid ${userUid}</div>
        </div>
        <div style="background: var(--app-color-background-transparent-65);color: var(--app-primary-color);padding: 6px 16px;border-radius: 16px;display: inline-block;margin-left: auto;text-wrap: nowrap;">经验 +${totalExp}</div>
      </div>

      <!-- 任务列表 -->
      <div style="padding: 4px 14px;">
        ${tasksHtml}
      </div>

      <!-- 底部统计 -->
      <div style="background: var(--app-bg-color-page); padding: 12px 14px; text-align: center; font-size: 12px; color: var(--el-text-color-secondary);border-top: 1px solid var(--el-border-color-light);">
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
