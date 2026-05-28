export interface AppSettings {
  /** 还原最大允许失败次数，0为无限制 */
  restoreMaxFailures: number
  /** 启用防风控策略 */
  avoidRiskControl: boolean
}
