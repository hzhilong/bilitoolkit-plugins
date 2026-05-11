import type { TaskCreateOptions, TaskId } from '@/core/types/task'
import { Task } from '@/core/task/task'
import type { ExecuteResult, Data, ExecuteResultPayload } from '@/core/types/execute'
import { db } from '@/core/db/db'
import { omitUndefined } from '@/core/utils/db'
import type { OperationType } from '@/core/types/operation'

export class TaskService {
  async getTaskById(taskId: number, errorMsg = '任务不存在'): Promise<Task> {
    const task = await db.task.get(taskId)
    if (!task) throw new Error(errorMsg)
    return task
  }

  /**
   * 创建任务
   * @param options 任务创建选项
   */
  async createTask<O extends OperationType = OperationType, D = Data>(options: TaskCreateOptions) {
    const id = await db.task.add({
      ...options,
      status: 'pending',
      progress: 0,
      progressMsg: '准备中',
      createdAt: Date.now(),
    })
    return (await this.getTaskById(id, '任务创建失败')) as Task<O, D>
  }

  /**
   * 更新任务进度
   */
  async updateTaskProgress(taskId: TaskId, progress?: number, progressMsg?: string) {
    await db.task.update(taskId, {
      ...omitUndefined({ progress, progressMsg }),
    })
  }

  async markTaskRunning(taskId: TaskId): Promise<Task> {
    await db.task.update(taskId, {
      progressMsg: '正在执行',
      status: 'running',
    })
    return this.getTaskById(taskId)
  }

  async markTaskAborted<O extends OperationType = OperationType, D = Data>(
    taskId: TaskId,
    payload?: ExecuteResultPayload<O, D>,
  ): Promise<Task> {
    const result = {
      success: false,
      msg: `任务已被取消`,
      ...payload,
    } as ExecuteResult<O, D>
    await db.task.update(taskId, {
      progressMsg: '任务已取消',
      status: 'cancelled',
      result: result,
    })
    return this.getTaskById(taskId)
  }

  async markTaskCompleted(taskId: TaskId, result: ExecuteResult): Promise<Task> {
    await db.task.update(taskId, {
      progressMsg: '任务执行成功',
      status: 'completed',
      result: result,
    })
    return this.getTaskById(taskId)
  }

  async markTaskFailed(taskId: TaskId, msg?: string): Promise<Task> {
    await db.task.update(taskId, {
      progressMsg: msg ?? '任务执行失败',
      status: 'failed',
    })
    return this.getTaskById(taskId)
  }

  /**
   * 更新结果
   */
  async updateResult<O extends OperationType = OperationType, D = Data>(taskId: TaskId, result?: ExecuteResult<O, D>) {
    await db.task.update(taskId, {
      result: result,
    })
    return this.getTaskById(taskId)
  }

  async suspendRunningTask() {
    await db.task
      .where('status')
      .equals('running')
      .modify({ status: 'failed', progressMsg: '任务已失效（应用重启后无法继续）' })
  }
}

export const taskService = new TaskService()
