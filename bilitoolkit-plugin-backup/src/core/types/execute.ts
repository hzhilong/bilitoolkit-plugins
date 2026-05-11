import type { BatchOptions } from '@/core/types/batch'
import type { OperationType } from '@/core/types/operation'
import type { BackupOptions, BackupResult } from '@/core/types/backup'
import type { RestoreOptions, RestoreResult } from '@/core/types/restore'
import type { ClearOptions, ClearResult } from '@/core/types/clear'
import type { TaskType } from '@/core/types/task'

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
export type ProgressCallback = (progress?: number, msg?: string) => Promise<void>

/**
 * 执行上下文
 */
export interface ExecuteContext {
  /** 目标用户 */
  user: TargetUser
  /** bili client id */
  clientId: string
  /** 进度回调 */
  progressCallback: ProgressCallback
  /** 取消信号 */
  abortSignal?: AbortSignal
}

/**
 * 基础的执行选项
 */
export type BaseExecuteOptions<O extends OperationType, T extends TaskType> = T extends 'normal'
  ? {
      /** 操作类型 */
      operationType: O
      /** 模式：正常模式，范围选择 */
      mode: 'normal'
    }
  : {
      /** 操作类型 */
      operationType: O
      /** 模式：批处理 */
      mode: 'batch'
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
 * 执行函数
 */
export type ExecuteFn = (context: ExecuteContext, options: ExecuteOptions) => Promise<ExecuteResult>

/**
 * 结果数据
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Data = any

/**
 * 执行结果负载
 */
export type ExecuteResultPayload<O extends OperationType = OperationType, D = Data> = O extends 'backup'
  ? BackupResult
  : O extends 'restore'
    ? RestoreResult<D>
    : ClearResult<D>

/**
 * 执行结果
 */
export type ExecuteResult<O extends OperationType = OperationType, D = Data> = {
  /** 是否执行成功 */
  success: boolean
  /** 提示信息 */
  msg: string
} & ExecuteResultPayload<O, D>
