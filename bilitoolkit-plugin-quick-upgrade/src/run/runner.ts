import type { TaskContext, InferConfig } from 'bilitoolkit-types'
import { type UserInfoWithCookie, BiliClient, type DailyTaskStatus } from '@ybgnb/bili-api'
import type { MyTaskConfigFields } from '../config/config.js'
import type { UserTaskResult, UpgradeTaskResult, UpgradeTaskContext } from '../types/index.js'
import { loginTask } from '../tasks/impl/login.js'
import { watchTask } from '../tasks/impl/watch.js'
import { shareTask } from '../tasks/impl/share.js'
import { coinTask } from '../tasks/impl/coin.js'
import type { UpgradeTask } from '../tasks/base.js'
import { dailyTaskStatusStore } from '../stores/daily-status.js'
import { sleepRandom, createLogger, serializeError } from '@ybgnb/utils'

export async function runByUser(
  user: UserInfoWithCookie,
  { config, signal, logger, api }: TaskContext<Omit<InferConfig<MyTaskConfigFields>, 'users'>>,
): Promise<UserTaskResult> {
  if (!config) throw new Error('缺少配置')

  const appLogger = createLogger(
    async () => {
      return await api.system.getLogLevel()
    },
    (logLevel, ...args) => {
      console[logLevel](`[${new Date().toLocaleString()}]`, ...args)
      api.system
        .saveLog({
          level: logLevel,
          data: args.map((arg) => {
            if (arg instanceof Error) return JSON.stringify(serializeError(arg))
            return JSON.stringify(arg)
          }),
        })
        .catch()
    },
  )

  const biliClient = new BiliClient({
    context: {
      userCookie: user.userCookie,
    },
    logLevel: await api.system.getLogLevel(),
    // bili api 库的日志只在控制台打印
    logger: appLogger,
  })

  const dailyTaskStatus = await dailyTaskStatusStore.get(biliClient, signal)

  const logPrefix = (task: UpgradeTask) => `[${task.toggleField.label}] [${user.mid}] `
  const upgradeTaskContext = {
    config,
    logger,
    logPrefix,
    biliClient,
    signal,
  } satisfies UpgradeTaskContext

  const results: UpgradeTaskResult[] = []
  const runAt = new Date()

  const runUpgradeTask = async (task: UpgradeTask) => {
    logger.info(`${logPrefix(task)} 执行中...`)
    const result = await task.run(upgradeTaskContext)
    results.push(result)
    logger.info(`${logPrefix(task)} ${result.message} ${result.success ? `经验+${result.exp}` : ''}`)
  }

  const handleSimpleTask = async <T extends keyof DailyTaskStatus>(
    task: UpgradeTask,
    finishedKey: T,
    checkFinished?: (value: DailyTaskStatus[T]) => boolean,
  ) => {
    const finishedStatus = dailyTaskStatus[finishedKey]
    if (typeof finishedStatus === 'boolean' ? finishedStatus : checkFinished!(finishedStatus)) {
      logger.info(`[${task.toggleField.label}] [${user.mid}] 已完成`)
    } else if (await task.shouldRunTask(upgradeTaskContext)) {
      await runUpgradeTask(task)
      await sleepRandom(1000, 1500)
    }
  }

  await handleSimpleTask(loginTask, 'login')
  await handleSimpleTask(watchTask, 'watch')
  await handleSimpleTask(coinTask, 'coins', (coins) => coins >= 50)
  await handleSimpleTask(shareTask, 'share')

  return {
    user,
    results,
    runAt,
  }
}
