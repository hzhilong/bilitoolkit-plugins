import type { TaskPlugin, TaskResult } from 'bilitoolkit-types'
import { type MyTaskConfigFields } from './config/config.js'
import { runByUser } from './run/runner.js'
import type { ArchiveTaskResult } from './types/index.js'
import { createArchiveTaskResultsHtml } from './utils/result.js'
import { lastQueryTimeRepo } from './db/last-query-time.js'

const plugin: TaskPlugin<MyTaskConfigFields> = {
  async run(context): Promise<TaskResult> {
    await lastQueryTimeRepo.init(context.api)

    const config = context.config
    if (!config) throw new Error('缺少配置')

    if (!Array.isArray(config.user) || config.user.length < 1) throw new Error('缺少user配置')

    const results: ArchiveTaskResult[] = []
    const result = await runByUser(config.user[0], context)
    if (result) {
      results.push(result)
    }

    if (results.length < 1) {
      context.logger.info('未发现最新的视频投稿')
    }

    return {
      success: true,
      message: '任务执行完成',
      details: results.length > 0 ? createArchiveTaskResultsHtml(results) : undefined,
    }
  },
}

export default plugin
