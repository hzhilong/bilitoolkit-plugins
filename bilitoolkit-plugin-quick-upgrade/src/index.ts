import type { TaskPlugin, TaskResult } from 'bilitoolkit-types'
import { type MyTaskConfigFields } from './config/config.js'
import { resultToHtml } from './utils/result.js'
import { runByUser } from './run/runner.js'

const plugin: TaskPlugin<MyTaskConfigFields> = {
  async run(context): Promise<TaskResult> {
    const config = context.config
    if (!config) throw new Error('缺少配置')

    if (!Array.isArray(config.users) || config.users.length < 1) throw new Error('缺少配置')

    const detailsHtml: string[] = []
    for (const user of config.users) {
      detailsHtml.push(resultToHtml(await runByUser(user, context)))
    }

    return {
      success: true,
      message: '任务执行完成',
      details: `<div style="display: flex;gap: 30px;">${detailsHtml.join('\n')}</div>`,
    }
  },
}

export default plugin
