<script setup lang="ts">
import { ref, useTemplateRef, onUnmounted } from 'vue'
import { PluginPageContent, useSelectedUserStore, LogPrint, showConfirm } from 'bilitoolkit-ui'
import { getErrorMessage } from '@ybgnb/utils'
import { BiliClient } from '@ybgnb/bili-api'
import { storeToRefs } from 'pinia'
import { clearCommentsByAicu } from '@/utils/comment'

const userStore = useSelectedUserStore()
const { assertLoggedIn } = userStore
const { user } = storeToRefs(userStore)
const loggerRef = useTemplateRef<InstanceType<typeof LogPrint>>('loggerRef')

const addLog = (msg: string) => {
  loggerRef.value?.addLog(msg)
}
const handleClearLog = () => {
  loggerRef.value?.reset()
}

const loading = ref<boolean>(false)
let abortController: AbortController | null = null
const handleStart = async () => {
  if (loading.value) {
    abortController?.abort()
    loading.value = false
    return
  }

  try {
    assertLoggedIn()
    await showConfirm('确定清空评论吗')
    loading.value = true
    abortController = new AbortController()
    const client = new BiliClient({
      context: {
        userCookie: user.value!.userCookie,
      },
    })
    const logger = (msg: string) => {
      addLog(msg)
    }

    await clearCommentsByAicu({ client, logger, signal: abortController.signal, uid: user.value!.mid })
  } catch (e) {
    addLog(getErrorMessage(e))
  } finally {
    loading.value = false
  }
}

onUnmounted(() => abortController?.abort())
</script>

<template>
  <PluginPageContent
    ><div class="page-content">
      <el-alert
        show-icon
        title="通过查询 Aicu 并删除自己的所有评论"
        description="仅删除自己在 B 站发布的评论，Aicu 中的数据不会受到影响。"
        :closable="false"
      />
      <div class="actions">
        <el-button @click="handleStart">{{ loading ? '停止删除' : '开始删除' }}</el-button>
        <el-button @click="handleClearLog">清空日志</el-button>
      </div>
      <LogPrint ref="loggerRef" class="log-print-box"></LogPrint></div
  ></PluginPageContent>
</template>

<style scoped lang="scss">
.page-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;

  .actions {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .log-print-box {
    width: 100%;
    flex: 1;
    min-height: 0;
  }
}
</style>
