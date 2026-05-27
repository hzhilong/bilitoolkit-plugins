import type { TaskGroup } from '@/core/types/task-group'

/**
 * 任务日志
 */
export interface TaskLog {
  /** id */
  id: number
  /** 任务 id */
  taskId: number
  /** 创建时间 */
  createdAt: number
  /** 任务进度提示 */
  content: string
}

export type TaskLogId = TaskLog['id']

export type CreateTaskLog = Omit<TaskLog, 'id' | 'createdAt'>
