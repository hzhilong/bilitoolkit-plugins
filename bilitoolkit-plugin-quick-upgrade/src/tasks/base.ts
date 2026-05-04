import type { TaskConfigField } from 'bilitoolkit-types'
import type { UpgradeTaskResult, UpgradeTaskContext } from '../types/index.js'

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
   */
  async shouldRunTask({ config, logger, logPrefix }: UpgradeTaskContext) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const configValue = (config as unknown as any)[this.toggleField.name]
    if ((typeof configValue === 'boolean' && !configValue) || (typeof configValue === 'number' && configValue < 1)) {
      logger.info(`${logPrefix(this)} 未开启`)
      return false
    }

    return true
  }

  abstract run(context: UpgradeTaskContext): Promise<UpgradeTaskResult>
}
