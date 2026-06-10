export interface AppSettings {
  /** 还原时最大允许失败次数，0为无限制 */
  restoreMaxFailures: number
  /** 清空时最大允许失败次数，0为无限制 */
  clearMaxFailures: number
  /** 启用防风控策略 */
  avoidRiskControl: boolean
  /** 还原前是否检查现有数据 */
  checkExistingData: boolean
}
