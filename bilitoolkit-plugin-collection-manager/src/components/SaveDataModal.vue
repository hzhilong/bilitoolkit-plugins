<script setup lang="ts">
import { useTemplateRef, ref, watch, onUnmounted } from 'vue'
import { LogPrint, showError, showConfirm } from 'bilitoolkit-ui'
import { getErrorMessage } from '@ybgnb/utils'
import { saveSeason } from '@/utils/save-season'
import { AppError } from 'bilitoolkit-types'
import type { SaveDataModalProps } from '@/components/types'

const props = defineProps<SaveDataModalProps>()
const emit = defineEmits<{
  (e: 'saved'): void
}>()
const visible = defineModel<boolean>({ required: true })
const loggerRef = useTemplateRef<InstanceType<typeof LogPrint>>('loggerRef')
let abortController: AbortController | null = null
const completed = ref<boolean>(false)

const execSaveTask = async () => {
  try {
    if (props.client === undefined) {
      throw new AppError('内部错误：client 为空')
    }
    abortController = new AbortController()
    await saveSeason({
      ...props,
      client: props.client!,
      logger: (msg: string) => loggerRef.value?.addLog(msg),
      signal: abortController.signal,
    })
    completed.value = true
  } catch (error) {
    const errorMessage = `操作失败：${getErrorMessage(error)}`
    showError(errorMessage)
    loggerRef.value?.addLog(errorMessage)
    completed.value = false
  }
}

const cancelTask = async () => {
  await showConfirm('确认取消执行吗?')
  abortController?.abort()
  completed.value = false
}

watch(
  visible,
  (newVal) => {
    if (newVal) {
      execSaveTask()
    } else {
      completed.value = false
      abortController = null
      loggerRef.value?.reset()
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  close()
})
const close = async () => {
  abortController?.abort()
  if (completed.value) {
    emit('saved')
  }
  visible.value = false
}
</script>

<template>
  <div class="tool-execution-modal">
    <el-dialog
      title="正在保存所有变更的数据"
      v-model="visible"
      width="80%"
      style="height: 88vh"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      align-center
    >
      <div class="header">
        <div class="actions">
          <el-button v-if="completed" type="primary" @click="close()">关闭</el-button>
          <el-button v-else @click="cancelTask">取消</el-button>
        </div>
      </div>
      <log-print ref="loggerRef" class="log-print-box"></log-print>

      <template #footer> </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.tool-execution-modal {
  ::v-deep(.el-dialog) {
    display: flex;
    flex-direction: column;

    .el-dialog__body {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    .el-dialog__footer {
      display: none;
    }
  }

  .header {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }
    margin-bottom: 18px;
  }

  .log-print-box {
    flex: 1;
  }
}
</style>
