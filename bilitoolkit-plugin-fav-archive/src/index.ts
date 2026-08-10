import type { TaskPlugin, TaskResult } from 'bilitoolkit-types'
import { type MyTaskConfigFields } from './config/config.js'
import { runByUser } from './run/runner.js'
import { lastFavQueryRepo } from './db/fav-sync-state.js'
import { getErrorMessage } from '@ybgnb/utils'
import { renderArchiveTaskCard } from './utils/result.js'

const plugin: TaskPlugin<MyTaskConfigFields> = {
  async run(context): Promise<TaskResult> {
    await lastFavQueryRepo.init(context.api)

    const config = context.config
    if (!config) throw new Error('缺少配置')

    if (!Array.isArray(config.user) || config.user.length < 1) throw new Error('缺少user配置')

    try {
      const result = await runByUser(config.user[0], context)
      if (result == null || result.totalMediaCount < 1) {
        context.logger.info('未发现最新的收藏视频')
        return {
          success: false,
          message: '任务执行完成，未发现最新的收藏视频',
        }
      }

      return {
        success: true,
        message: `任务执行完成，已提交 ${result!.totalMediaCount} 个视频下载任务`,
        details: renderArchiveTaskCard(result!),
      }
    } catch (e) {
      context.logger.error(e)
      return {
        success: false,
        message: `任务执行失败：${getErrorMessage(e)}`,
      }
    }
  },
}

export default plugin
