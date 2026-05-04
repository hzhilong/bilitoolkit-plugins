import { UpgradeTask } from '../base.js'
import type { TaskConfigField } from 'bilitoolkit-types'
import { taskConfigSchemaMap } from '../../config/config.js'
import type { UpgradeTaskResult, UpgradeTaskContext } from '../../types/index.js'
import { getErrorMessage } from '@ybgnb/utils'

export class LoginTask extends UpgradeTask {
  toggleField: TaskConfigField = taskConfigSchemaMap.login

  async run({ signal, biliClient }: UpgradeTaskContext): Promise<UpgradeTaskResult> {
    try {
      await biliClient.user.getMyInfo(undefined, { signal })
      return this.successResult('执行完成', 5)
    } catch (e) {
      return this.failedResult(getErrorMessage(e))
    }
  }
}

export const loginTask = new LoginTask()
