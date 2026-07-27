import type { TaskContext, InferConfig } from 'bilitoolkit-types'
import { type UserInfoWithCookie, BiliClient } from '@ybgnb/bili-api'
import type { MyTaskConfigFields } from '../config/config.js'
import type { ArchiveTaskResult } from '../types/index.js'
import { createAppLogger } from '../utils/logger.js'
import { handleVideoArchive } from '../utils/video-archive.js'
import { parsePositiveInteger } from '../utils/parse.js'

export async function runByUser(
  user: UserInfoWithCookie,
  { config, signal, logger, api }: TaskContext<Omit<InferConfig<MyTaskConfigFields>, 'user'>>,
): Promise<ArchiveTaskResult | null> {
  if (!config) throw new Error('缺少配置')
  if (config.uid == null) throw new Error('uid 配置无效')
  const targetUid = parsePositiveInteger(String(config.uid))
  if (targetUid == null) throw new Error('uid 配置无效')

  const appLogger = createAppLogger(api)
  const logPrefix = `[${targetUid}]`

  const biliClient = new BiliClient({
    context: {
      userCookie: user.userCookie,
    },
    logLevel: await api.system.getLogLevel(),
    // bili api 库的日志只在控制台打印
    logger: appLogger,
  })

  logger.info(`${logPrefix} 执行中...`)

  return await handleVideoArchive({
    config,
    targetUid,
    logger,
    logPrefix,
    user,
    biliClient,
    signal,
    api,
  })
}
