import { type MaybeRefOrGetter, computed, toValue } from 'vue'
import { type Task, TaskStatusMap, TaskTypeMap } from '@/core/types/task'
import { type OperationType, OperationTypeMap } from '@/core/types/operation'

export const useTaskDisplay = <O extends OperationType = OperationType>(
  task: MaybeRefOrGetter<Task<O> | undefined>,
) => {
  const taskState = computed(() => {
    const taskData = toValue(task)
    return taskData ? TaskStatusMap[taskData.status] : ''
  })
  const operationType = computed(() => {
    const taskData = toValue(task)
    return taskData ? OperationTypeMap[taskData.operationType] : ''
  })
  const createdAt = computed(() => {
    const taskData = toValue(task)
    return taskData ? new Date(taskData.createdAt).toLocaleString() : ''
  })
  const taskType = computed(() => {
    const taskData = toValue(task)
    return taskData ? TaskTypeMap[taskData.type] : ''
  })
  return { taskState, createdAt, operationType, taskType }
}
