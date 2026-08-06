import type { TaskPlugin, TaskResult } from 'bilitoolkit-types'
import { type MyTaskConfigFields } from './config/config.js'
import { runByUser } from './run/runner.js'
import { parseResultHtmlAndActions } from './utils/result.js'
import { lastQueryTimeRepo } from './db/last-query-time.js'

const plugin: TaskPlugin<MyTaskConfigFields> = {
  async run(context): Promise<TaskResult> {
    await lastQueryTimeRepo.init(context.api)

    const config = context.config
    if (!config) throw new Error('缺少配置')

    if (!Array.isArray(config.user) || config.user.length < 1) throw new Error('缺少user配置')

    const result = await runByUser(config.user[0], context)

    let msg
    if (result?.dynamics.length) {
      msg = `任务执行完成，共发现 ${result.dynamics.length} 个最新的图文动态`
    } else {
      msg = `任务执行完成，未发现最新的图文动态`
    }

    const parsedResult = result ? parseResultHtmlAndActions(result) : null
    return {
      success: true,
      message: msg,
      details: parsedResult ? parsedResult.details : undefined,
      actions: parsedResult ? parsedResult.actions : undefined,
    }
  },
}

export default plugin
