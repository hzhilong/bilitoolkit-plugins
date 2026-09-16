export interface AppSettings {
  /**
   * 业务请求最小间隔时间（毫秒）
   * 每次业务接口调用完成后，随机等待该时间范围内的值后再执行下一次请求。
   * 用于控制请求频率，降低短时间大量操作触发风控的风险。
   */
  businessRequestIntervalMinMs: number

  /**
   * 业务请求最大间隔时间（毫秒）
   * 每次业务接口调用完成后，随机等待该时间范围内的值后再执行下一次请求。
   * 实际等待时间会在最小间隔和最大间隔之间随机生成。
   */
  businessRequestIntervalMaxMs: number
}
