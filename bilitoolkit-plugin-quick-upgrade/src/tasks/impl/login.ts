import { UpgradeTask } from '../base'
import type { TaskConfigField, InferConfig } from 'bilitoolkit-types'
import { taskConfigSchemaMap, type TaskConfigFields } from '../../config/config'
import { BiliClient } from '@ybgnb/bili-api'
import type { UpgradeTaskResult } from '../../types'
import { getErrorMessage } from '@ybgnb/utils'

export class LoginTask extends UpgradeTask {
  toggleField: TaskConfigField = taskConfigSchemaMap.login

  async run(
    config: Omit<InferConfig<TaskConfigFields>, 'users'>,
    biliClient: BiliClient,
    signal: AbortSignal | undefined,
  ): Promise<UpgradeTaskResult> {
    try {
      await biliClient.user.getMyInfo(undefined, { signal })
      return this.successResult('执行完成', 5)
    } catch (e) {
      return this.failedResult(getErrorMessage(e))
    }
  }
}

export const loginTask = new LoginTask()
