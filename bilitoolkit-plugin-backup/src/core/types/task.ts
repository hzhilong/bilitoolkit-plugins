import type { Task } from '@/core/task/task'

export type TaskId = Task['id']

export type TaskType = 'normal' | 'batch'

/**
 * 任务状态映射数据
 */
export const TaskStatusMap = {
  // 准备
  pending: '准备',
  // 运行
  running: '运行',
  // 暂停
  //  paused: '暂停',
  // 批次完成
  batchCompleted: '批次完成',
  // 完成
  completed: '完成',
  // 失败
  failed: '失败',
  // 取消
  cancelled: '取消',
} as const

/**
 * 任务状态
 */
export type TaskStatus = keyof typeof TaskStatusMap

/**
 * 任务创建选项
 */
export type TaskCreateOptions = Pick<Task, 'type' | 'operationType' | 'dataType' | 'executeOptions' | 'user'>
