export interface AppSettings {
  /** 还原最大允许失败次数，0为无限制 */
  restoreMaxFailures: number
  /** 清空最大允许失败次数，0为无限制 */
  clearMaxFailures: number
  /** 启用防风控策略 */
  avoidRiskControl: boolean
}
