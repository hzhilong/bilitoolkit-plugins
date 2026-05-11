import type { OperationType } from '@/core/types/operation'
import type { DataType } from '@/core/types/data-type'
import { type ExecuteOptions, type ExecuteResult, type TargetUser, type Data } from '@/core/types/execute'
import type { TaskStatus, TaskType } from '@/core/types/task'

/**
 * 执行任务
 */
export class Task<O extends OperationType = OperationType, D = Data> {
  constructor(
    // 任务 ID
    public id: number,
    // 任务 类型
    public type: TaskType,
    // 创建时间
    public createdAt: number,
    // 操作类型
    public operationType: O,
    // 数据类型
    public dataType: DataType,
    // 执行目标用户
    public user: TargetUser,
    // 执行选项
    public executeOptions: ExecuteOptions<O>,
    // 任务状态
    public status: TaskStatus,
    // 任务进度
    public progress: number,
    // 任务提示
    public progressMsg?: string,
    // 执行结果
    public result?: ExecuteResult<O, D>,
  ) {}
}
