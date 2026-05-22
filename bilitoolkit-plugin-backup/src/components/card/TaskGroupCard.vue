<script setup lang="ts" generic="O extends OperationType = OperationType">
import { type OperationType } from '@/core/types/operation'
import { type TaskGroup, type TaskGroupStatus } from '@/core/types/task-group'
import { computed, reactive, watch, onUnmounted } from 'vue'
import type { Task, TaskStatus, TaskId } from '@/core/types/task'
import { taskService } from '@/core/service/task'
import { AppTooltip, IconButton, showToast } from 'bilitoolkit-ui'
import type { GroupExecuteContext, OnProgress, OnStatusChange } from '@/core/types/execute'
import { useExecTaskGroup } from '@/composables/useExecTaskGroup'
import { useTaskGroupDisplay } from '@/composables/useTaskGroupDisplay'
import { taskGroupService } from '@/core/service/task-group'
import { eventBus } from '@/utils/event-bus'

const props = withDefaults(
  defineProps<{
    /**
     * @default true
     */
    showBoxShadow?: boolean
    autoExec?: boolean
  }>(),
  {
    autoExec: false,
    showBoxShadow: true,
  },
)
const cardStyles = computed(() => {
  return {
    boxShadow: props.showBoxShadow ? 'var(--el-box-shadow)' : 'none',
  }
})
const taskGroup = defineModel<TaskGroup<O>>({ required: true })

const items = reactive<Task[]>([])
const { taskGroupState, operationType, createdAt, itemsProgressData, hasBatchTask, canContinue, canCancel } =
  useTaskGroupDisplay(taskGroup, () => items)

const init = async () => {
  const list = []
  const lastId = taskGroup.value.id
  for (const item of taskGroup.value.items) {
    list.push(await taskService.getById(item.id))
  }
  if (lastId === taskGroup.value.id) {
    items.splice(0, list.length, ...list)
    if (props.autoExec) {
      await exec()
    }
  }
}
watch(
  () => taskGroup.value,
  (newValue, oldValue) => {
    if (newValue.id !== oldValue?.id) {
      init()
    }
  },
  { immediate: true },
)

const handleItemsProgressChange = (id: TaskId, progress: number | undefined, msg: string | undefined) => {
  items.forEach((task) => {
    if (task.id === id) {
      task.progress = progress ?? task.progress
      task.progressMsg = msg ?? task.progressMsg
    }
  })
}
const handleItemsStatusChange = (id: TaskId, status: TaskStatus) => {
  items.forEach((task) => {
    if (task.id === id) {
      task.status = status
    }
  })
}
const { execTaskGroup, cancelTaskGroup } = useExecTaskGroup()
let canceled = false
onUnmounted(() => {
  canceled = true
})
// 构建执行上下文
const buildExecContext = () => {
  const onStatusChange = (status: TaskGroupStatus) => {
    if (!canceled) {
      taskGroup.value.status = status
    }
  }
  const onProgress = async (progress: number | undefined, msg: string | undefined) => {
    if (!canceled) {
      taskGroup.value.progress = progress ?? taskGroup.value.progress
      taskGroup.value.progressMsg = msg ?? taskGroup.value.progressMsg
    }
  }
  const onItemsProgress = items.map((item) => {
    const id = item.id
    const onProgress: OnProgress = async (progress: number | undefined, msg: string | undefined) => {
      if (!canceled) {
        handleItemsProgressChange(id, progress, msg)
      }
    }
    return onProgress
  })
  const onItemsStatusChange = items.map((item) => {
    const id = item.id
    const onStatusChange: OnStatusChange<TaskStatus> = (status: TaskStatus) => {
      if (!canceled) {
        handleItemsStatusChange(id, status)
      }
    }
    return onStatusChange
  })
  return {
    onStatusChange,
    onItemsProgress,
    onItemsStatusChange,
    onProgress,
  } as GroupExecuteContext
}
// 执行任务组
const exec = async () => {
  await execTaskGroup(buildExecContext(), taskGroup.value.id)
}
const cancel = async () => {
  if (await cancelTaskGroup(taskGroup.value.id)) {
    showToast('任务组已取消')
  } else {
    showToast('任务组取消失败，可能已执行完成')
  }
  taskGroup.value = await taskGroupService.getById<O>(taskGroup.value.id)
  eventBus.emit('refreshTaskGroups')
}
</script>

<template>
  <div class="task-group-card" :style="cardStyles">
    <div class="card-header">
      <span class="task-group-name">{{ operationType }}任务组 </span>
      <span class="task-group-id">#{{ taskGroup.id }}</span>
      <span class="task-group-status" :class="taskGroup.status">{{ taskGroupState }}</span>
      <span v-if="hasBatchTask" class="task-group-batch-flag">包含分批处理任务</span>
      <div class="card-actions">
        <IconButton
          v-if="canContinue"
          icon="play"
          tip="继续执行分批处理的任务"
          confirm="是否继续执行分批处理的任务？"
          @click="exec"
        />
        <IconButton v-if="canCancel" icon="close-circle" tip="取消执行" confirm="是否取消执行？" @click="cancel" />
      </div>
    </div>
    <div class="card-body">
      <div class="info-row">
        <div class="info-label">目标用户</div>
        <div class="info-value user-info">
          <img class="user-face" :src="taskGroup.user.face" alt="face" />
          <AppTooltip class="user-name" :content="taskGroup.user.name" />
          <span class="user-uid">uid {{ taskGroup.user.mid }}</span>
        </div>
      </div>
      <div class="info-row">
        <div class="info-label">创建时间</div>
        <div class="info-value">{{ createdAt }}</div>
      </div>
      <div class="progress-section">
        <div class="info-row">
          <div class="info-label">已完成任务</div>
          <div class="info-value">{{ itemsProgressData.completedCount }}/{{ itemsProgressData.total }}</div>
        </div>
        <el-progress
          class="task-group-progress"
          :percentage="taskGroup.progress"
          :stroke-width="12"
          :show-text="false"
          :striped="taskGroup.status === 'running'"
          :striped-flow="taskGroup.status === 'running'"
        />
      </div>
      <div class="footer">
        <div class="task-group-time">{{ createdAt }}</div>
        <AppTooltip class="task-group-progress-msg" :content="taskGroup.progressMsg ?? ''"></AppTooltip>
      </div>
      <div class="task-group-items">
        <div class="items-label">任务列表：</div>
        <TaskCard v-for="item in items" :task="item" :key="item.id" :show-box-shadow="false" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.task-group-card {
  border-radius: 10px;
  border: 1px solid var(--el-border-color);
  font-size: 14px;

  .card-header {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    font-size: 12px;
    padding: 8px 16px;
    border-bottom: 1px solid var(--el-border-color);

    .task-group-name {
      font-size: 14px;
      font-weight: bold;
      color: var(--el-text-color-primary);
    }

    .task-group-id {
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }

    .task-group-status {
      font-size: 12px;
      border-radius: 20px;
      padding: 0 6px;
      margin-left: 20px;
      color: color-mix(in srgb, var(--status-color), #000 10%);
      --status-color: var(--el-color-info);
      background-color: color-mix(in srgb, var(--status-color), transparent 80%);

      &.pending {
        --status-color: var(--el-color-info);
      }
      &.running {
        --status-color: var(--el-color-primary);
      }
      &.batchCompleted,
      &.completed {
        --status-color: var(--el-color-success);
      }
      &.failed {
        --status-color: var(---app-error-color);
      }
      &.cancelled {
        --status-color: var(--el-color-warning);
      }
    }

    .task-group-batch-flag {
      margin-left: 10px;
      font-size: 12px;
      border-radius: 20px;
      padding: 0 6px;
      color: color-mix(in srgb, var(--el-color-primary), #000 10%);
      --status-color: var(--el-color-info);
      background-color: var(--app-color-primary-transparent-20);
    }

    .card-actions {
      margin-left: auto;
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
      color: var(--el-color-primary);

      .icon-btn {
        border-radius: 50%;
      }
    }
  }

  .card-body {
    padding: 16px 26px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: var(--el-text-color-regular);
  }

  .user-info {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 4px;

    .user-face {
      width: 18px;
      height: 18px;
      border-radius: 50%;
    }

    .user-name {
    }

    .user-uid {
      color: var(--el-text-color-secondary);
      font-size: calc(1em - 1px);
      text-wrap: nowrap;
      margin-left: 2px;
    }
  }

  .info-row {
    display: grid;
    grid-template-columns: 70px 1fr;
    gap: 12px;
    align-items: baseline;
  }

  .info-label {
    color: var(--el-text-color-primary);
  }

  .info-value {
    word-break: break-word;
  }

  .task-group-progress {
    margin: 4px 0;
  }

  .footer {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: 30px;
    > * {
      text-wrap: nowrap;
    }

    .task-group-time {
      color: var(--el-text-color-secondary);
    }

    .task-group-progress-msg {
      color: var(--el-text-color-regular);
    }
  }

  .task-group-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
    border-top: 1px solid var(--el-border-color-extra-light);
    padding-top: 10px;
  }
}
</style>
