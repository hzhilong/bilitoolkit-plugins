import type { MonitorConfig } from '@/types'
import { getErrorMessage } from '@ybgnb/utils'
import type { BiliCommentEntity } from 'bili-comment-core'
import { FeiShuBot } from './feishu'

export async function handlePush(config: MonitorConfig, comments: BiliCommentEntity[], logger: (msg: string) => void) {
  if (!config.pushConfigs?.length) {
    return
  }
  logger('正在推送消息')

  const configName = config.name

  try {
    for (const pushConfig of config.pushConfigs) {
      if (pushConfig.type === 'FeiShuBot') {
        await new FeiShuBot(pushConfig.webhookUrl, pushConfig.secret).sendMonitorResultByPost(configName, comments)
      }
    }
  } catch (e) {
    logger(getErrorMessage(e))
  }
}
