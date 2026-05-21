import type { OperationType } from '@/core/types/operation'
import type { TargetUser, ExecuteOptions } from '@/core/types/execute'
import type { DataType } from '@/core/types/data-type'
import type { BackupResult } from '@/core/types/backup'
import type { RestoreResult } from '@/core/types/restore'
import type { ClearResult } from '@/core/types/clear'
import type { Data } from '@/core/types/data-module'

export type TaskId = Task['id']

export const TaskTypeMap = {
  normal: '普通模式',
  batch: '分批处理模式',
} as const

export type TaskType = keyof typeof TaskTypeMap

/**
 * 任务状态映射数据
 */
export const TaskStatusMap = {
  // 准备
  pending: '准备中',
  // 运行
  running: '运行中',
  // 暂停
  //  paused: '暂停',
  // 批次完成
  batchCompleted: '批次已完成',
  // 完成
  completed: '已完成',
  // 失败
  failed: '已失败',
  // 取消
  cancelled: '已取消',
} as const

/**
 * 任务状态
 */
export type TaskStatus = keyof typeof TaskStatusMap

/**
 * 任务创建选项
 */
export type TaskCreateOptions = Pick<Task, 'type' | 'operationType' | 'dataType' | 'executeOptions' | 'user'>

/**
 * 执行任务
 */
export interface Task<O extends OperationType = OperationType, D extends Data = Data> {
  /** 任务 ID */
  id: number
  /** 任务类型 */
  type: TaskType
  /** 创建时间 */
  createdAt: number
  /** 操作类型 */
  operationType: O
  /** 数据类型 */
  dataType: DataType
  /** 执行目标用户 */
  user: TargetUser
  /** 执行选项 */
  executeOptions: ExecuteOptions<O>
  /** 任务状态 */
  status: TaskStatus
  /** 任务进度 */
  progress: number
  /** 任务进度提示 */
  progressMsg?: string
  /** 执行结果 */
  result?: TaskResult<O, D>
}

/**
 * 任务结果负载
 */
export type TaskResultPayload<O extends OperationType = OperationType, D extends Data = Data> = O extends 'backup'
  ? BackupResult
  : O extends 'restore'
    ? RestoreResult<D>
    : ClearResult<D>

/**
 * 任务结果
 */
export type TaskResult<O extends OperationType = OperationType, D extends Data = Data> = {
  /** 是否执行成功 */
  success: boolean
  /** 提示信息 */
  msg: string
} & TaskResultPayload<O, D>
