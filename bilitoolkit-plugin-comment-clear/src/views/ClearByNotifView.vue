<script setup lang="ts">
import { ref, useTemplateRef, onUnmounted } from 'vue'
import { PluginPageContent, useSelectedUserStore, LogPrint } from 'bilitoolkit-ui'
import { getErrorMessage } from '@ybgnb/utils'
import { BiliClient } from '@ybgnb/bili-api'
import { storeToRefs } from 'pinia'
import { clearCommentsByNotif } from '@/utils/comment'

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
    await clearCommentsByNotif({ client, logger, signal: abortController.signal })
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
        title="遍历被回复/被点赞的互动通知，删除其中能定位到的互动评论，并同时删除这些通知"
        :closable="false"
      ></el-alert>
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
