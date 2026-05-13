import type { TaskCreateOptions, TaskId, Task, TaskResultPayload, TaskResult } from '@/core/types/task'
import { db } from '@/core/db/db'
import { omitUndefined } from '@/core/utils/db'
import type { OperationType } from '@/core/types/operation'
import type { Data } from '@/core/types/data-module'

export class TaskService {
  async getById(taskId: TaskId, errorMsg = '任务不存在'): Promise<Task> {
    const task = await db.task.get(taskId)
    if (!task) throw new Error(errorMsg)
    return task
  }

  async create<O extends OperationType = OperationType, D extends Data = Data>(options: TaskCreateOptions) {
    const id = await db.task.add({
      ...options,
      status: 'pending',
      progress: 0,
      progressMsg: '准备中',
      createdAt: Date.now(),
    })
    return (await this.getById(id, '任务创建失败')) as Task<O, D>
  }

  async updateProgress(taskId: TaskId, progress?: number, progressMsg?: string) {
    await db.task.update(taskId, {
      ...omitUndefined({ progress, progressMsg }),
    })
  }

  async markRunning(taskId: TaskId): Promise<Task> {
    await db.task.update(taskId, {
      progressMsg: '正在执行',
      status: 'running',
    })
    return this.getById(taskId)
  }

  async markAborted<O extends OperationType = OperationType, D extends Data = Data>(
    taskId: TaskId,
    payload?: TaskResultPayload<O, D>,
  ): Promise<Task> {
    const result = {
      success: false,
      msg: `任务已被取消`,
      ...payload,
    } as TaskResult<O, D>
    await db.task.update(taskId, {
      progressMsg: '任务已取消',
      status: 'cancelled',
      result: result,
    })
    return this.getById(taskId)
  }

  async markCompleted<O extends OperationType = OperationType, D extends Data = Data>(
    taskId: TaskId,
    result: TaskResult<O, D>,
  ): Promise<Task> {
    await db.task.update(taskId, {
      progressMsg: '任务执行成功',
      status: 'completed',
      result: result,
    })
    return this.getById(taskId)
  }

  async markBatchCompleted<O extends OperationType = OperationType, D extends Data = Data>(
    taskId: TaskId,
    result: TaskResult<O, D>,
  ): Promise<Task> {
    await db.task.update(taskId, {
      progressMsg: '任务批次执行成功',
      status: 'batchCompleted',
      result: result,
    })
    return this.getById(taskId)
  }

  async markFailed(taskId: TaskId, msg?: string): Promise<Task> {
    await db.task.update(taskId, {
      progressMsg: msg ?? '任务执行失败',
      status: 'failed',
    })
    return this.getById(taskId)
  }

  /**
   * 更新结果
   */
  async updateResult<O extends OperationType = OperationType, D extends Data = Data>(
    taskId: TaskId,
    result?: TaskResult<O, D>,
  ) {
    await db.task.update(taskId, {
      result: result,
    })
    return this.getById(taskId)
  }

  async suspendRunningTask() {
    await db.task
      .where('status')
      .equals('running')
      .modify({ status: 'failed', progressMsg: '任务已失效（应用重启后无法继续）' })
  }
}

export const taskService = new TaskService()
