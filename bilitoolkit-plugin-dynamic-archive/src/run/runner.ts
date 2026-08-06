import type { TaskContext, InferConfig } from 'bilitoolkit-types'
import { type UserInfoWithCookie, BiliClient } from '@ybgnb/bili-api'
import type { MyTaskConfigFields } from '../config/config.js'
import type { ArchiveTaskResult } from '../types/index.js'
import { createAppLogger } from '../utils/logger.js'
import { handleDynamicArchive } from '../utils/dynamic-archive.js'
import { parsePositiveInteger } from '../utils/parse.js'

export async function runByUser(
  user: UserInfoWithCookie,
  { config, signal, logger, api, taskConfigCreatedAt }: TaskContext<Omit<InferConfig<MyTaskConfigFields>, 'user'>>,
): Promise<ArchiveTaskResult | null> {
  if (!config) throw new Error('缺少配置')
  if (config.uid == null) throw new Error('uids 配置无效')
  const targetUid = parsePositiveInteger(String(config.uid))
  if (!targetUid) throw new Error('uids 配置无效')

  const appLogger = createAppLogger(api)
  const biliClient = new BiliClient({
    context: {
      userCookie: user.userCookie,
    },
    logLevel: await api.system.getLogLevel(),
    // bili api 库的日志只在控制台打印
    logger: appLogger,
  })

  const logPrefix = `动态存档 [${targetUid}]`
  logger.info(`${logPrefix} 执行中...`)

  return await handleDynamicArchive({
    config,
    targetUid,
    logger,
    logPrefix,
    user,
    biliClient,
    signal,
    api,
    taskConfigCreatedAt,
  })
}
