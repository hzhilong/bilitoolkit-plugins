import { UpgradeTask } from '../base'
import type { TaskConfigField, InferConfig } from 'bilitoolkit-types'
import { taskConfigSchemaMap, type TaskConfigFields } from '../../config/config'
import { BiliClient, type Dynamic } from '@ybgnb/bili-api'
import type { UpgradeTaskResult } from '../../types'
import { getErrorMessage } from '@ybgnb/utils'
import { getVideoAid } from '../../utils/dynamic'

export class CoinTask extends UpgradeTask {
  toggleField: TaskConfigField = taskConfigSchemaMap.coin

  shouldRunTask(
    config: Omit<InferConfig<TaskConfigFields>, 'users'>,
    signal?: AbortSignal,
    todayCoins?: number,
  ): boolean
  shouldRunTask(config: Omit<InferConfig<TaskConfigFields>, 'users'>, signal?: AbortSignal): boolean
  shouldRunTask(config: Omit<InferConfig<TaskConfigFields>, 'users'>, signal?: AbortSignal, todayCoins?: number) {
    if (!super.shouldRunTask(config, signal)) {
      return false
    }

    const dailyCoin = config.dailyCoin as number

    if (dailyCoin !== undefined && typeof todayCoins === 'number') {
      return dailyCoin > todayCoins
    }

    return true
  }

  run(
    config: Omit<InferConfig<TaskConfigFields>, 'users'>,
    biliClient: BiliClient,
    signal: AbortSignal | undefined,
    dynamicList: Dynamic[] | null,
    todayCoins: number,
  ): Promise<UpgradeTaskResult>
  run(
    config: Omit<InferConfig<TaskConfigFields>, 'users'>,
    biliClient: BiliClient,
    signal: AbortSignal | undefined,
    dynamicList: Dynamic[] | null,
  ): Promise<UpgradeTaskResult>
  async run(
    config: Omit<InferConfig<TaskConfigFields>, 'users'>,
    biliClient: BiliClient,
    signal: AbortSignal | undefined,
    dynamicList: Dynamic[] | null,
    todayCoins?: number,
  ): Promise<UpgradeTaskResult> {
    if (typeof todayCoins !== 'number') {
      throw new Error('内部错误')
    }
    try {
      const dailyCoin = config.dailyCoin as number

      let successCount = 0
      let failedCount = 0
      let dynamicIndex = 0

      while (successCount < dailyCoin - todayCoins && failedCount < 5) {
        // 从动态获取视频aid，通过随机数补充
        const { aid, index } = getVideoAid(dynamicList, dynamicIndex)
        dynamicIndex = index

        // 查询稿件关系
        const archiveRelation = await biliClient.videoAction.getRelation({ avid: aid })
        // 不存在或者已投币
        if (archiveRelation.code !== 0 || archiveRelation.data.coin > 0) continue

        // 投1个币
        const response = await biliClient.videoAction.coin({ avid: aid, multiply: 1 })
        if (response.code === 0) {
          successCount++
        } else if (response.code !== 34002 && response.code !== 10003) {
          // 10003：不存在该稿件； 34002：不能给自己投币
          return this.failedResult(`任务中止，已投币数目：${successCount}。失败原因：${response.message}`)
        } else {
          failedCount++
        }
      }

      if (failedCount >= 5) return this.failedResult(`任务中止，失败次数过多。已投币数目：${successCount}。`)

      return this.successResult('执行完成', 5)
    } catch (e) {
      return this.failedResult(getErrorMessage(e))
    }
  }
}

export const coinTask = new CoinTask()
