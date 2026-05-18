import type { BatchOptions } from '@/core/types/batch'
import type { OperationType } from '@/core/types/operation'
import type { BackupOptions } from '@/core/types/backup'
import type { RestoreOptions } from '@/core/types/restore'
import type { ClearOptions } from '@/core/types/clear'
import type { TaskType, TaskId, TaskStatus } from '@/core/types/task'
import type { TaskGroupStatus } from '@/core/types/task-group'

/**
 * 目标用户
 */
export interface TargetUser {
  uid: number
  name: string
}

/**
 * 进度回调
 */
export type OnProgress = (progress?: number, msg?: string) => Promise<void>

/**
 * 状态监听
 */
export type OnStatusChange<S extends TaskStatus | TaskGroupStatus> = (status: S) => void

/**
 * 执行上下文
 */
export interface ExecuteContext {
  /** 目标用户 */
  user: TargetUser
  /** bili client id */
  clientId: string
  /** 进度回调 */
  onProgress?: OnProgress
  /** 状态监听 */
  onStatusChange?: OnStatusChange<TaskGroupStatus>
  /** 取消信号 */
  abortSignal?: AbortSignal
}

/**
 * 基础的执行选项
 */
export type BaseExecuteOptions<O extends OperationType, T extends TaskType> = [T] extends ['normal']
  ? {
      /** 操作类型 */
      operationType: O
      /** 模式：正常模式，范围选择 */
      mode: T
    }
  : {
      /** 操作类型 */
      operationType: O
      /** 模式：批处理 */
      mode: T
      /** 启用分批处理的选项 */
      batchOptions: BatchOptions
    }

/**
 * 执行选项
 */
export type ExecuteOptions<O extends OperationType = OperationType> = O extends 'backup'
  ? BackupOptions
  : O extends 'restore'
    ? RestoreOptions
    : ClearOptions

/**
 * 执行结果
 */
export type ExecuteResult = {
  taskId: TaskId
}

/**
 * 任务组执行上下文
 */
export type GroupExecuteContext = Pick<ExecuteContext, 'abortSignal' | 'onProgress' | 'onStatusChange'> & {
  /** 任务项进度监听 */
  onItemsProgress?: OnProgress[]
  /** 任务项状态监听 */
  onItemsStatusChange?: OnStatusChange<TaskGroupStatus>[]
}
