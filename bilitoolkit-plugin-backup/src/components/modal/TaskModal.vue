<script setup lang="ts" generic="O extends OperationType = OperationType">
import { watch, ref } from 'vue'
import type { OperationType } from '@/core/types/operation'
import { useLoadingData, AppTooltip } from 'bilitoolkit-ui'
import type { TaskId, Task } from '@/core/types/task'
import { taskService } from '@/core/service/task'
import { useTaskDisplay } from '@/composables/useTaskDisplay'

const props = defineProps<{
  taskId: TaskId
}>()
const task = ref<Task<O>>()
const { loading, loadingData, hasLoaded } = useLoadingData()
const init = loadingData(async () => {
  const taskId = props.taskId
  if (taskId) {
    const oldData = await taskService.getById<O>(taskId)
    if (taskId === props.taskId) {
      task.value = oldData
    }
  } else {
    task.value = undefined
  }
})
const visible = defineModel({ required: true, type: Boolean })
watch(
  () => visible.value,
  (newVal, oldVal) => {
    if (newVal && newVal !== oldVal) {
      init()
    }
  },
  {
    immediate: true,
  },
)
const { operationType, taskState, createdAt, taskType } = useTaskDisplay<O>(task)
</script>

<template>
  <div class="dialog">
    <el-dialog
      title="任务详情"
      v-model="visible"
      width="66%"
      style="max-width: 600px; min-width: 400px; max-height: 90vh; overflow: hidden"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="true"
      align-center
    >
      <div class="dialog-content" v-loading="loading">
        <el-empty v-if="!task && hasLoaded" :description="`内部错误，不存在任务[${taskId}]`"></el-empty>
        <el-descriptions class="task-info" v-if="task">
          <el-descriptions-item label="任务 ID">{{ task.id }}</el-descriptions-item>
          <el-descriptions-item label="任务类型">{{ taskType }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ createdAt }}</el-descriptions-item>
          <el-descriptions-item label="操作类型">{{ operationType }}</el-descriptions-item>
          <el-descriptions-item label="执行目标用户">
            <div class="user-info">
              <AppTooltip class="user-name" :content="task.user.name" />
              <span class="user-uid">uid {{ task.user.uid }}</span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="任务状态">{{ taskState }}</el-descriptions-item>
          <el-descriptions-item label="任务进度">
            <el-progress
              class="task-group-progress"
              :percentage="task.progress"
              :stroke-width="12"
              :show-text="false"
              :striped="task.status === 'running'"
              :striped-flow="task.status === 'running'"
            />
          </el-descriptions-item>
          <el-descriptions-item label="任务进度提示">{{ task.progressMsg ?? '' }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <template #footer>
        <div class="dialog-footer"></div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.user-info {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 4px;

  .user-name {
  }

  .user-uid {
    color: var(--el-text-color-secondary);
    font-size: calc(1em - 1px);
    text-wrap: nowrap;
    margin-left: 2px;
  }
}
</style>
