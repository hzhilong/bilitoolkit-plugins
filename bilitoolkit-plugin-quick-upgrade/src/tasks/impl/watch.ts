import { UpgradeTask } from '../base.js'
import type { TaskConfigField } from 'bilitoolkit-types'
import { taskConfigSchemaMap } from '../../config/config.js'
import type { UpgradeTaskResult, UpgradeTaskContext } from '../../types/index.js'
import { getErrorMessage, sleepRandom } from '@ybgnb/utils'
import { getVideoAid } from '../../utils/dynamic.js'
import { dynamicStore } from '../../stores/dynamic.js'

export class WatchTask extends UpgradeTask {
  toggleField: TaskConfigField = taskConfigSchemaMap.watch

  async run({ signal, biliClient, logger, logPrefix }: UpgradeTaskContext): Promise<UpgradeTaskResult> {
    try {
      const { aid, bvid } = await getVideoAid(biliClient, await dynamicStore.get(biliClient, signal), undefined, signal)

      logger.info(`${logPrefix(this)} 即将观看视频 [${bvid}]`)
      await sleepRandom(600, 1000)
      await biliClient.videoReport.heartbeat(
        {
          w_aid: aid,
        },
        {
          aid: aid,
        },
        { signal },
      )
      logger.info(`${logPrefix(this)} 观看视频 [${bvid}] 成功`)
      return this.successResult('执行完成', 5)
    } catch (e) {
      return this.failedResult(getErrorMessage(e))
    }
  }
}

export const watchTask = new WatchTask()
