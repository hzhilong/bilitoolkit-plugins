/* eslint-disable @typescript-eslint/no-explicit-any */
import { type OperationType, OperationTypeMap } from '@/core/types/operation'
import { type TaskStatus, TaskStatusMap } from '@/core/types/task'
import { type TaskGroupStatus, TaskGroupStatusMap } from '@/core/types/task-group'
import { formatTime } from '@ybgnb/utils'
import type { DefaultRow } from 'element-plus/es/components/table/src/table/defaults'

export const formatCreatedAt = (createdAt: { createdAt: number } | number | DefaultRow) => {
  if (!createdAt) return ''
  if (typeof createdAt === 'number') return formatTime(createdAt)
  return formatTime(createdAt.createdAt)
}

export const formatOperationType = (operationType: { operationType: OperationType } | OperationType | DefaultRow) => {
  if (!operationType) return ''
  if (typeof operationType === 'string') return OperationTypeMap?.[operationType] ?? ''
  return (OperationTypeMap as any)?.[operationType.operationType] ?? ''
}

export const formatTaskState = (status: { status: TaskStatus } | TaskStatus | DefaultRow) => {
  if (!status) return ''
  if (typeof status === 'string') return TaskStatusMap?.[status] ?? ''
  return (TaskStatusMap as any)?.[status.status] ?? ''
}

export const formatTaskGroupStatus = (status: { status: TaskGroupStatus } | TaskGroupStatus | DefaultRow) => {
  if (!status) return ''
  if (typeof status === 'string') return TaskGroupStatusMap?.[status] ?? ''
  return (TaskGroupStatusMap as any)?.[status.status] ?? ''
}
