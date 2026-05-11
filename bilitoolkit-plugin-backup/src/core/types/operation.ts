/**
 * 操作类型映射数据
 */
export const OperationTypeMap = {
  backup: '备份',
  restore: '还原',
  clear: '清空',
} as const

/**
 * 操作类型
 */
export type OperationType = keyof typeof OperationTypeMap

/**
 * 操作结果
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface OperationResult<D = any> {
  data: D
}
