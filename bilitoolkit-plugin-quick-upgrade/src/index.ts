import type { TaskPlugin, TaskResult, TaskContext, InferConfig } from 'bilitoolkit-types'
import { taskConfigSchema, taskSchedule, type TaskConfigFields } from './config/config'
import { BiliClient, type UserInfoWithCookie } from '@ybgnb/bili-api'
import type { UserTaskResult, UpgradeTaskResult } from './types'
import { resultToHtml } from './utils/result'
import { loginTask } from './tasks/impl/login'
import { watchTask } from './tasks/impl/watch'
import { shareTask } from './tasks/impl/share'
import { coinTask } from './tasks/impl/coin'

const plugin: TaskPlugin<TaskConfigFields> = {
  taskConfigSchema: taskConfigSchema,
  defaultSchedule: taskSchedule,
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
      details: `<div style="display: flex;">${detailsHtml.join('\n')}</div>`,
    }
  },
}

export const runByUser = async (
  user: UserInfoWithCookie,
  { config, fetcher, signal }: TaskContext<Omit<InferConfig<TaskConfigFields>, 'users'>>,
): Promise<UserTaskResult> => {
  if (!config) throw new Error('缺少配置')
  const biliClient = new BiliClient({
    fetcher: fetcher,
    context: {
      userCookie: user.userCookie,
    },
  })

  const dailyTaskStatus = await biliClient.userExp.getDailyTaskStatus()
  const dynamicList = await biliClient.dynamic.fetchReplyPage({ type: 'video' })

  const results: UpgradeTaskResult[] = []
  const runAt = new Date()

  if (!dailyTaskStatus.login && loginTask.shouldRunTask(config, signal)) {
    results.push(await loginTask.run(config, biliClient, signal))
  }
  if (!dailyTaskStatus.watch && watchTask.shouldRunTask(config, signal)) {
    results.push(await watchTask.run(config, biliClient, signal, dynamicList))
  }
  if (dailyTaskStatus.coins < 50 && coinTask.shouldRunTask(config, signal, dailyTaskStatus.coins / 10)) {
    results.push(await coinTask.run(config, biliClient, signal, dynamicList, dailyTaskStatus.coins / 10))
  }
  if (!dailyTaskStatus.share && shareTask.shouldRunTask(config, signal)) {
    results.push(await shareTask.run(config, biliClient, signal, dynamicList))
  }

  return {
    user,
    results,
    runAt,
  }
}

export default plugin
