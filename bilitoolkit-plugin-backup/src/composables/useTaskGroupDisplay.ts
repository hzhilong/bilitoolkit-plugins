import { type MaybeRefOrGetter, computed, toValue } from 'vue'
import { type Task, type TaskStatus } from '@/core/types/task'
import { type OperationType, OperationTypeMap } from '@/core/types/operation'
import { TaskGroupStatusMap, type TaskGroup } from '@/core/types/task-group'
import { inArray } from '@/core/utils/array'

export const useTaskGroupDisplay = <O extends OperationType = OperationType>(
  taskGroup: MaybeRefOrGetter<TaskGroup<O>>,
  items: MaybeRefOrGetter<Task[]>,
) => {
  const taskGroupState = computed(() => {
    const taskGroupData = toValue(taskGroup)
    return TaskGroupStatusMap[taskGroupData.status]
  })
  const operationType = computed(() => {
    const taskGroupData = toValue(taskGroup)
    return OperationTypeMap[taskGroupData.operationType]
  })
  const createdAt = computed(() => {
    const taskGroupData = toValue(taskGroup)
    return new Date(taskGroupData.createdAt).toLocaleString()
  })
  // 任务项进度数据
  const itemsProgressData = computed(() => {
    const itemsData = toValue(items)
    const completedCount = itemsData.filter((item) =>
      inArray<TaskStatus>(item.status, ['batchCompleted', 'completed']),
    ).length
    return {
      completedCount,
      total: itemsData.length,
    }
  })
  // 是否有分批处理任务
  const hasBatchTask = computed(() => {
    const itemsData = toValue(items)
    return itemsData.some((item) => item.type === 'batch')
  })
  // 是否可以继续执行分批处理
  const canContinueExecBatch = computed(() => {
    const taskGroupData = toValue(taskGroup)
    return taskGroupData.status === 'batchCompleted'
  })
  // 是否可以取消
  const canCancel = computed(() => {
    const taskGroupData = toValue(taskGroup)
    return taskGroupData.status === 'running'
  })
  return { taskGroupState, operationType, createdAt, itemsProgressData, hasBatchTask, canContinueExecBatch, canCancel }
}
