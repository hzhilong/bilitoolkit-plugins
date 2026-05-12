import { db } from '@/core/db/db'
import { omitUndefined } from '@/core/utils/db'
import type { OperationType } from '@/core/types/operation'
import type { CreateTaskGroup, TaskGroupId, TaskGroup } from '@/core/types/task-group'

export class TaskGroupService {
  async getById<O extends OperationType = OperationType>(
    groupId: TaskGroupId,
    errorMsg = '任务组不存在',
  ): Promise<TaskGroup<O>> {
    const group = (await db.taskGroup.get(groupId)) as TaskGroup<O>
    if (!group) throw new Error(errorMsg)
    return group
  }

  async create<O extends OperationType = OperationType>(group: CreateTaskGroup<O>) {
    const id = await db.taskGroup.add({
      ...group,
      createdAt: Date.now(),
      status: 'pending',
      progress: 0,
      progressMsg: '准备中',
    })
    return (await this.getById(id, '任务组创建失败')) as TaskGroup<O>
  }

  async updateProgress(groupId: TaskGroupId, progress?: number, progressMsg?: string) {
    await db.taskGroup.update(groupId, {
      ...omitUndefined({ progress, progressMsg }),
    })
  }

  async markRunning<O extends OperationType = OperationType>(groupId: TaskGroupId): Promise<TaskGroup<O>> {
    await db.taskGroup.update(groupId, {
      progressMsg: '正在执行',
      status: 'running',
    })
    return this.getById(groupId)
  }

  async markAborted<O extends OperationType = OperationType>(groupId: TaskGroupId): Promise<TaskGroup<O>> {
    await db.taskGroup.update(groupId, {
      progressMsg: '任务已取消',
      status: 'cancelled',
    })
    return this.getById(groupId)
  }

  async markCompleted<O extends OperationType = OperationType>(groupId: TaskGroupId): Promise<TaskGroup<O>> {
    await db.taskGroup.update(groupId, {
      progressMsg: '任务执行成功',
      status: 'completed',
    })
    return this.getById(groupId)
  }

  async markBatchCompleted<O extends OperationType = OperationType>(groupId: TaskGroupId): Promise<TaskGroup<O>> {
    await db.taskGroup.update(groupId, {
      progressMsg: '任务批次执行成功',
      status: 'batchCompleted',
    })
    return this.getById(groupId)
  }

  async markFailed<O extends OperationType = OperationType>(groupId: TaskGroupId, msg?: string): Promise<TaskGroup<O>> {
    await db.taskGroup.update(groupId, {
      progressMsg: msg ?? '任务执行失败',
      status: 'failed',
    })
    return this.getById(groupId)
  }

  async suspendRunningTask() {
    // TODO 遍历任务项
    await db.task
      .where('status')
      .equals('running')
      .modify({ status: 'failed', progressMsg: '任务已失效（应用重启后无法继续）' })
  }
}

export const taskGroupService = new TaskGroupService()
