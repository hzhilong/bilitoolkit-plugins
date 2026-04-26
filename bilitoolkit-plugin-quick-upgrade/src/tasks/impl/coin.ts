import { UpgradeTask } from '../base'
import type { TaskConfigField } from 'bilitoolkit-types'
import { taskConfigSchemaMap } from '../../config/config'
import type { UpgradeTaskResult, UpgradeTaskContext } from '../../types'
import { getErrorMessage, sleepRandom } from '@ybgnb/utils'
import { getVideoAid } from '../../utils/dynamic'
import { dailyTaskStatusStore } from '../../stores/daily-status'
import { dynamicStore } from '../../stores/dynamic'

export class CoinTask extends UpgradeTask {
  toggleField: TaskConfigField = taskConfigSchemaMap.coin

  async shouldRunTask(context: UpgradeTaskContext) {
    if (!(await super.shouldRunTask(context))) {
      return false
    }
    const { config, biliClient, signal, logger, logPrefix } = context

    const dailyCoin = config.dailyCoin as number

    const dailyTaskStatus = await dailyTaskStatusStore.get(biliClient, signal)
    if (dailyCoin !== undefined && dailyCoin <= dailyTaskStatus.coins / 10) {
      logger.info(`${logPrefix(this)} 已达到投币上限 ${dailyCoin}`)
      return false
    }

    return true
  }

  async run({ config, biliClient, logger, logPrefix, signal }: UpgradeTaskContext): Promise<UpgradeTaskResult> {
    const dynamicList = await dynamicStore.get(biliClient, signal)
    const dailyTaskStatus = await dailyTaskStatusStore.get(biliClient, signal)
    const todayCoins = dailyTaskStatus.coins / 10
    logger.info(`${logPrefix(this)} 今日已投${todayCoins}个币`)
    try {
      const dailyCoin = config.dailyCoin as number

      let successCount = 0
      let failedCount = 0
      let dynamicIndex = 0

      const needCoins = dailyCoin - todayCoins
      logger.info(`${logPrefix(this)} 今日还需投${needCoins}个币`)

      while (successCount < needCoins && failedCount < 5) {
        // 从动态获取视频aid，通过热门榜单补充
        logger.info(`${logPrefix(this)} 从动态/热门榜单获取视频中`)
        const { aid, index, bvid } = await getVideoAid(biliClient, dynamicList, dynamicIndex, signal)
        dynamicIndex = index

        await sleepRandom(600, 1000)
        // 查询稿件关系
        const archiveRelation = await biliClient.videoAction.getRelation({ aid: aid }, { signal })
        // 不存在或者已投币
        if (archiveRelation.code !== 0 || archiveRelation.data.coin > 0) continue

        logger.info(`${logPrefix(this)} 即将给视频 [${bvid}] 投1个币`)
        // 投1个币
        await sleepRandom(600, 1000)
        const response = await biliClient.videoAction.coin({ aid: aid, multiply: 1 }, { signal })
        if (response.code === 0) {
          logger.info(`${logPrefix(this)} 视频 [${bvid}] 投币成功`)
          successCount++
        } else if (response.code !== 34002 && response.code !== 10003) {
          // 10003：不存在该稿件； 34002：不能给自己投币
          logger.info(`${logPrefix(this)} 视频 [${bvid}] 投币失败：${response.message}`)
          return this.failedResult(`任务中止，已投币数目：${successCount}。失败原因：${response.message}`)
        } else {
          failedCount++
        }
      }

      if (failedCount >= 5) return this.failedResult(`任务中止，失败次数过多。已投币数目：${successCount}。`)

      return this.successResult('任务执行完成', successCount * 10)
    } catch (e) {
      return this.failedResult(getErrorMessage(e))
    }
  }
}

export const coinTask = new CoinTask()
