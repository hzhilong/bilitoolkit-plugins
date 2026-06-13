import type { OperationType } from '@/core/types/operation'
import type { DataType } from '@/core/types/data-type'
import type { ExecuteOptions, User } from '@/core/types/execute'
import type { TaskId } from '@/core/types/task'
import type { MaxLengthArray } from '@ybgnb/utils'

/**
 * 任务组状态映射数据
 */
export const TaskGroupStatusMap = {
  // 准备
  pending: '准备中',
  // 运行
  running: '运行中',
  // 暂停
  paused: '已暂停',
  // 批次完成
  batchCompleted: '批次完成',
  // 完成
  completed: '已完成',
  // 失败
  failed: '已失败',
  // 取消
  cancelled: '已取消',
} as const

/**
 * 任务组状态
 */
export type TaskGroupStatus = keyof typeof TaskGroupStatusMap

/**
 * 任务组
 */
export interface TaskGroup<O extends OperationType = OperationType> {
  /** 任务组 ID */
  id: number
  /** 创建时间 */
  createdAt: number
  /** 操作类型 */
  operationType: O
  /** 执行目标用户 */
  user: User
  /** 任务组状态 */
  status: TaskGroupStatus
  /** 任务进度 */
  progress: number
  /** 任务进度提示 */
  progressMsg?: string
  /** 任务项列表 */
  items: TaskGroupItem[]
}

export type TaskGroupId = TaskGroup['id']

/**
 * 任务项
 */
export interface TaskGroupItem<O extends OperationType = OperationType> {
  /** 任务 id */
  id: TaskId
  /** 数据类型 */
  dataType: DataType
  /** 执行选项 */
  executeOptions: ExecuteOptions<O>
}

/**
 * 任务组创建选项
 */
export type CreateTaskGroupOptions<O extends OperationType = OperationType> = Pick<
  TaskGroup<O>,
  'operationType' | 'user'
> & {
  items: Pick<TaskGroupItem, 'dataType' | 'executeOptions'>[]
}

/**
 * 任务组创建对象（内部已关联任务id）
 */
export type CreateTaskGroup<O extends OperationType = OperationType> = Pick<
  TaskGroup<O>,
  'operationType' | 'user' | 'items'
>

/**
 * 任务组过滤条件
 */
export type TaskGroupFilters = Partial<Pick<TaskGroup, 'operationType' | 'status'>> & {
  /** 创建时间 */
  createdAt?: MaxLengthArray<number, 2>
  /** 任务状态集合 */
  statusArr?: TaskGroupStatus[]
}
