import { db } from '@/core/db/db'
import Dexie from 'dexie'
import type { CreateTaskLog, TaskLogId, TaskLog } from '@/core/types/log'
import type { TaskId } from '@/core/types/task'
import type { PageParams, PageResult } from 'bilitoolkit-ui'

export class TaskLogService {
  async getById(id: TaskLogId, errorMsg = '日志不存在'): Promise<TaskLog> {
    const log = await db.taskLog.get(id)
    if (!log) throw new Error(errorMsg)
    return log as TaskLog
  }

  async create(log: CreateTaskLog) {
    const id = await db.taskLog.add({
      ...log,
      createdAt: Date.now(),
    })
    return (await this.getById(id, '日志创建失败')) as TaskLog
  }

  async getAllByTaskId(taskId: TaskId, lastId?: TaskLogId) {
    const finalLastId = lastId != null ? lastId + 1 : Dexie.minKey
    return db.taskLog.where('[taskId+id]').between([taskId, finalLastId], [taskId, Dexie.maxKey]).reverse().toArray()
  }

  async fetchPage({ pageNum, pageSize }: PageParams, taskId: TaskId) {
    const query = db.taskLog.where('[taskId+id]').between([taskId, Dexie.minKey], [taskId, Dexie.maxKey])
    const list = await query
      .clone()
      .reverse()
      .offset((pageNum - 1) * pageSize)
      .limit(pageSize)
      .toArray()
    const count = await query.count()
    return {
      data: list,
      pageNum: pageNum,
      pageSize: pageSize,
      totalPages: Math.ceil(count / pageSize),
      total: count,
    } satisfies PageResult<TaskLog>
  }
}

export const taskLogService = new TaskLogService()
