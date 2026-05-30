<script setup lang="ts" generic="O extends OperationType = OperationType">
import { watch, ref, computed } from 'vue'
import type { OperationType } from '@/core/types/operation'
import { useLoadingData, AppTooltip, toolkitApi } from 'bilitoolkit-ui'
import type { TaskId, Task, TaskResult } from '@/core/types/task'
import { taskService } from '@/core/service/task'
import { useTaskDisplay } from '@/composables/useTaskDisplay'
import type { BaseExecuteOptions, ExecuteOptions } from '@/core/types/execute'
import type { BatchOptions } from '@/core/types/batch'
import type { BackupAsset, BackupResult, BackupOptions } from '@/core/types/backup'
import BackupConfig from '@/components/form/BackupConfig.vue'
import ClearConfig from '@/components/form/ClearConfig.vue'
import RestoreConfig from '@/components/form/RestoreConfig.vue'
import type { RestoreOptions } from '@/core/types/restore'
import type { ClearOptions } from '@/core/types/clear'

const props = defineProps<{
  taskId: TaskId
}>()
const task = ref<Task<O>>()
const { loading, loadingData, hasLoaded } = useLoadingData()

// 还原用的备份任务
const backupTaskForRestore = ref<Task<'backup'>>()

const init = loadingData(async () => {
  const taskId = props.taskId
  if (taskId) {
    const taskData = await taskService.getById<O>(taskId)
    if (taskId === props.taskId) {
      task.value = taskData
      if (taskData.operationType === 'restore') {
        const executeOptions = taskData.executeOptions as ExecuteOptions<'restore'>
        backupTaskForRestore.value = await taskService.getById(executeOptions.backupTaskId)
      }
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
// 分批处理进度
const batchProgress = computed(() => {
  if (task.value?.operationType === 'clear' || task.value?.type === 'normal') return undefined
  return (task.value?.result as TaskResult<'backup' | 'restore'> | undefined)?.batchProgress
})

const _batchOptions = computed<BatchOptions | undefined>(() => {
  if (task.value?.operationType === 'clear' || task.value?.type === 'normal') return undefined
  return (task.value?.executeOptions as BaseExecuteOptions<'backup' | 'restore', 'batch'> | undefined)?.batchOptions
})
const backupAssets = computed<BackupAsset[] | undefined>(() => {
  if (task.value?.operationType !== 'backup') return undefined
  return (task.value?.result as BackupResult | undefined)?.backupAssets
})
const handleShowAsset = (asset: BackupAsset) => {
  toolkitApi.system.showItemInFolder(asset.filePath)
}
</script>

<template>
  <div class="task-modal">
    <el-dialog
      title="任务详情"
      v-model="visible"
      width="96%"
      style="min-width: 700px; max-height: 98vh; overflow: auto"
      :close-on-click-modal="true"
      :close-on-press-escape="true"
      :show-close="true"
      align-center
    >
      <div class="dialog-content" v-loading="loading">
        <el-empty v-if="!task && hasLoaded" :description="`内部错误，不存在任务[${taskId}]`"></el-empty>
        <el-descriptions v-if="task" border title="任务状态和配置">
          <el-descriptions-item label="任务 ID">{{ task.id }}</el-descriptions-item>
          <el-descriptions-item label="任务类型">{{ taskType }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ createdAt }}</el-descriptions-item>
          <el-descriptions-item label="操作类型">{{ operationType }}</el-descriptions-item>
          <el-descriptions-item label="目标用户"><AppTooltip :content="task.user.name" /></el-descriptions-item>
          <el-descriptions-item label="任务状态">{{ taskState }}</el-descriptions-item>
          <!--          <el-descriptions-item label="任务进度">{{ task.progress }}/100 </el-descriptions-item>-->
          <el-descriptions-item label="进度提示">
            <div class="task-progress-msg">
              {{ task.progressMsg }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="执行选项">
            <BackupConfig
              v-if="task.operationType === 'backup'"
              v-model="task.executeOptions as BackupOptions"
              :viewMode="true"
              :dataType="task.dataType"
              :user="task.user"
            ></BackupConfig>
            <RestoreConfig
              v-else-if="task.operationType === 'restore' && backupTaskForRestore"
              v-model="task.executeOptions as RestoreOptions"
              :viewMode="true"
              :dataType="task.dataType"
              :user="task.user"
              :backup-task="backupTaskForRestore"
            >
            </RestoreConfig>
            <ClearConfig
              v-else-if="task.operationType === 'clear'"
              v-model="task.executeOptions as ClearOptions"
              :viewMode="true"
              :dataType="task.dataType"
              :user="task.user"
            ></ClearConfig>
          </el-descriptions-item>
        </el-descriptions>
        <el-descriptions v-if="task?.result" border title="执行结果">
          <el-descriptions-item label="执行状态">{{ task.result.success ? '成功' : '失败' }}</el-descriptions-item>
          <el-descriptions-item label="结果说明">{{ task.result.msg }}</el-descriptions-item>
          <template v-if="backupAssets">
            <el-descriptions-item label="备份资源">
              <div>
                <div v-for="asset in backupAssets" :key="asset.name">
                  <el-button link type="primary" @click="handleShowAsset(asset)">{{ asset.fileName }}</el-button>
                </div>
              </div>
            </el-descriptions-item>
          </template>
        </el-descriptions>
        <template v-if="batchProgress">
          <el-descriptions border title="分批处理进度">
            <el-descriptions-item v-if="batchProgress.totalBatchCount" label="批次总数">{{
              batchProgress.totalBatchCount
            }}</el-descriptions-item>
            <el-descriptions-item label="当前批次">{{ batchProgress.nextBatch - 1 }}</el-descriptions-item>
            <el-descriptions-item label="完成状态">{{
              batchProgress.isFinished ? '已结束' : '未结束'
            }}</el-descriptions-item>
            <template v-if="!batchProgress.isFinished">
              <el-descriptions-item label="下一批次">{{ batchProgress.nextBatch }}</el-descriptions-item>
              <el-descriptions-item v-if="batchProgress.remainingDataCount" label="剩余数据">{{
                batchProgress.remainingDataCount
              }}</el-descriptions-item>
              <el-descriptions-item v-if="batchProgress.remainingBatchCount" label="剩余批次">{{
                batchProgress.remainingBatchCount
              }}</el-descriptions-item>
            </template>
          </el-descriptions>
        </template>
      </div>

      <template #footer>
        <div class="dialog-footer"></div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.task-modal {
  display: contents;
  ::v-deep(.el-descriptions__header) {
    margin-bottom: 4px;
    padding-left: 10px;
    position: relative;

    &::before {
      content: '';
      width: 3px;
      height: 1.2em;
      background: var(--el-color-primary);
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
    }
  }
  ::v-deep(.el-descriptions__label) {
    text-wrap: nowrap;
  }
  ::v-deep(.el-descriptions) {
    .task-progress-msg {
    }
  }
  ::v-deep(.el-form-item) {
    margin-bottom: 0;
  }
  ::v-deep(.el-radio:not(.is-checked)) {
    display: none;
  }
  .dialog-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
}
</style>
