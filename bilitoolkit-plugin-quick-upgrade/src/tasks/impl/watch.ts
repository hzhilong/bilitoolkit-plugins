import { UpgradeTask } from '../base'
import type { TaskConfigField, InferConfig } from 'bilitoolkit-types'
import { taskConfigSchemaMap, type TaskConfigFields } from '../../config/config'
import { BiliClient, type Dynamic } from '@ybgnb/bili-api'
import type { UpgradeTaskResult } from '../../types'
import { getErrorMessage } from '@ybgnb/utils'
import { getVideoAid } from '../../utils/dynamic'

export class WatchTask extends UpgradeTask {
  toggleField: TaskConfigField = taskConfigSchemaMap.watch

  async run(
    config: Omit<InferConfig<TaskConfigFields>, 'users'>,
    biliClient: BiliClient,
    signal: AbortSignal | undefined,
    dynamicList: Dynamic[] | null,
  ): Promise<UpgradeTaskResult> {
    try {
      const aid = getVideoAid(dynamicList).aid

      await biliClient.videoReport.heartbeat(
        {
          w_aid: aid,
        },
        {
          aid: aid,
        },
        { signal },
      )
      return this.successResult('执行完成', 5)
    } catch (e) {
      return this.failedResult(getErrorMessage(e))
    }
  }
}

export const watchTask = new WatchTask()
