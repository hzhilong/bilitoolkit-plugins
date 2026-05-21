import { type OperationType, OperationTypeMap } from '@/core/types/operation'
import { type TaskStatus, TaskStatusMap } from '@/core/types/task'
import { type TaskGroupStatus, TaskGroupStatusMap } from '@/core/types/task-group'
import { formatTime } from '@ybgnb/utils'

export const formatCreatedAt = (createdAt: { createdAt: number } | number) => {
  if (!createdAt) return ''
  if (typeof createdAt === 'number') return formatTime(createdAt)
  return formatTime(createdAt.createdAt)
}

export const formatOperationType = (operationType: { operationType: OperationType } | OperationType) => {
  if (!operationType) return ''
  if (typeof operationType === 'string') return OperationTypeMap?.[operationType] ?? ''
  return OperationTypeMap?.[operationType.operationType] ?? ''
}

export const formatTaskState = (status: { status: TaskStatus } | TaskStatus) => {
  if (!status) return ''
  if (typeof status === 'string') return TaskStatusMap?.[status] ?? ''
  return TaskStatusMap?.[status.status] ?? ''
}

export const formatTaskGroupStatus = (status: { status: TaskGroupStatus } | TaskGroupStatus) => {
  if (!status) return ''
  if (typeof status === 'string') return TaskGroupStatusMap?.[status] ?? ''
  return TaskGroupStatusMap?.[status.status] ?? ''
}
