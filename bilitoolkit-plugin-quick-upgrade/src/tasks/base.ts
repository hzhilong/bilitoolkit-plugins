import type { TaskConfigField, InferConfig } from 'bilitoolkit-types'
import type { UpgradeTaskResult } from '../types'
import { type TaskConfigFields } from '../config/config'
import { AbortError } from '@ybgnb/utils'
import { BiliClient, type Dynamic } from '@ybgnb/bili-api'

/**
 * 升级任务
 */
export abstract class UpgradeTask<Name extends string = string> {
  /** 任务开关关联的配置字段 */
  abstract toggleField: TaskConfigField<Name>

  successResult(message: string, exp: number): UpgradeTaskResult {
    return {
      type: this.toggleField.label,
      success: true,
      message: message,
      exp: exp,
    }
  }

  failedResult(message: string): UpgradeTaskResult {
    return {
      type: this.toggleField.label,
      success: false,
      message: message,
      exp: 0,
    }
  }

  /**
   * 判断是否可以运行任务
   * @param config  配置信息
   * @param signal  取消信号
   */
  shouldRunTask(config: Omit<InferConfig<TaskConfigFields>, 'users'>, signal?: AbortSignal) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const configValue = (config as unknown as any)[this.toggleField.name]
    if ((typeof configValue === 'boolean' && !configValue) || (typeof configValue === 'number' && configValue < 1)) {
      return false
    }

    if (signal?.aborted) throw new AbortError()

    return true
  }
  abstract run(
    config: Omit<InferConfig<TaskConfigFields>, 'users'>,
    biliClient: BiliClient,
    signal: AbortSignal | undefined,
    dynamicList: Dynamic[] | null,
  ): Promise<UpgradeTaskResult>
}
