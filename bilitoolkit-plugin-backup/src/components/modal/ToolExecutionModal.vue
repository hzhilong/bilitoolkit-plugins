<script setup lang="ts">
import type { ToolContext } from '@/types/tools'
import { computed, useTemplateRef, ref, watch, onUnmounted } from 'vue'
import { LogPrint, showError, showConfirm } from 'bilitoolkit-ui'
import { getErrorMessage, isCanceledError } from '@ybgnb/utils'
import type { User } from '@/core/types/execute'
import type { Tool } from '@/tools'
import { useAppSettingsStore } from '@/stores/app-settings'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  tool: Tool
  user: User
}>()
const visible = defineModel<boolean>({ required: true })
const title = computed(() => `【${props.tool.title}】`)
const loggerRef = useTemplateRef<InstanceType<typeof LogPrint>>('loggerRef')
const abortController = ref<AbortController>()

watch(visible, (newVal) => {
  if (newVal) {
    abortController.value = undefined
    loggerRef.value?.reset()
  } else {
    cancelTool()
  }
})

onUnmounted(() => {
  cancelTool()
})
const { appSettings } = storeToRefs(useAppSettingsStore())
const execTool = async () => {
  if (abortController.value) {
    showError('已有工具正在运行')
    return
  }
  abortController.value = new AbortController()
  const context: ToolContext = {
    log(msg: string) {
      loggerRef.value?.addLog(msg)
    },
    user: props.user,
    signal: abortController.value.signal,
    appSettings: appSettings.value,
  }
  try {
    await props.tool.executor(context)
  } catch (e) {
    const errorMessage = getErrorMessage(e)
    if (!errorMessage.includes('cancel') && !isCanceledError(e)) loggerRef.value?.addLog(errorMessage)
  } finally {
    abortController.value = undefined
  }
}
const cancelTool = async (needConfirm?: boolean) => {
  if (needConfirm) {
    try {
      await showConfirm('确认取消执行吗?')
    } catch {
      return
    }
  }
  abortController.value?.abort()
}
</script>

<template>
  <div class="tool-execution-modal">
    <el-dialog
      :title="title"
      v-model="visible"
      width="80%"
      style="height: 88vh"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="true"
      align-center
    >
      <div class="header">
        <div class="tool-desc">{{ tool.desc }}</div>
        <div class="actions">
          <el-button :disabled="!!abortController" type="primary" @click="execTool">开始</el-button>
          <el-button :disabled="!abortController" @click="cancelTool(true)">取消</el-button>
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
