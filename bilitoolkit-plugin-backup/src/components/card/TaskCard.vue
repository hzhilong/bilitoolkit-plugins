<script setup lang="ts" generic="O extends OperationType = OperationType">
import { type OperationType, OperationTypeMap } from '@/core/types/operation'
import { computed } from 'vue'
import { type Task, TaskStatusMap } from '@/core/types/task'
import { IconButton, AppTooltip } from 'bilitoolkit-ui'
import { useDataModule } from '@/composables/useDataModule'

export interface TaskCardProps {
  task: Task
  /**
   * @default true
   */
  showBoxShadow?: boolean
}
const props = withDefaults(defineProps<TaskCardProps>(), {
  showBoxShadow: true,
})

const taskState = computed(() => {
  return TaskStatusMap[props.task.status]
})
const operationType = computed(() => {
  return OperationTypeMap[props.task.operationType]
})
const createdAt = computed(() => {
  return new Date(props.task.createdAt).toLocaleString()
})
const { dataModuleColor, dataModuleName } = useDataModule(() => props.task.dataType)
const cardStyles = computed(() => {
  return {
    boxShadow: props.showBoxShadow ? 'var(--el-box-shadow-lighter)' : 'none',
    '--data-type-color': dataModuleColor.value,
  }
})
</script>

<template>
  <div class="task-card" :style="cardStyles">
    <div class="header">
      <div class="task-title-wrapper">
        <span class="task-operation-type">{{ operationType }} </span>
        <span class="task-data-type">[{{ dataModuleName }}]</span>
        <span class="task-id">#{{ task.id }}</span>
      </div>
      <div class="task-status" :class="task.status">{{ taskState }}</div>
      <div class="card-actions">
        <IconButton icon="information-2" tip="任务详情" />
      </div>
    </div>
    <el-progress
      class="task-progress"
      :percentage="task.progress"
      :stroke-width="8"
      :show-text="false"
      :striped="task.status === 'running'"
      :striped-flow="task.status === 'running'"
    />
    <div class="footer">
      <div class="task-time">{{ createdAt }}</div>
      <AppTooltip class="task-progress-msg" :content="task.progressMsg ?? ''"></AppTooltip>
    </div>
  </div>
</template>

<style scoped lang="scss">
.task-card {
  border-radius: 10px;
  border: 1px solid var(--el-border-color);
  padding: 6px 10px;
  font-size: 12px;

  > .header {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: 20px;

    .task-title-wrapper {
      font-size: 13px;
      color: var(--el-text-color-primary);
      .task-operation-type {
      }

      .task-data-type {
      }

      .task-id {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }

    .task-status {
      font-size: 12px;
      border-radius: 20px;
      padding: 0 6px;
      color: color-mix(in srgb, var(--status-color), #000 10%);
      --status-color: var(--el-color-info);
      background-color: color-mix(in srgb, var(--status-color), transparent 90%);

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

    .card-actions {
      margin-left: auto;
      display: flex;
      align-items: center;
      flex-wrap: nowrap;
      color: var(--el-color-primary);
      > * {
        border-radius: 50%;
      }
    }
  }

  .task-progress {
    margin: 2px 0;
  }

  > .footer {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: 30px;
    > * {
      text-wrap: nowrap;
    }

    .task-time {
      color: var(--el-text-color-secondary);
    }

    .task-progress-msg {
      color: var(--el-text-color-regular);
    }
  }
}
</style>
