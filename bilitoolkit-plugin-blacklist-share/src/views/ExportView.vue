<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { PluginPageContent, useSelectedUserStore, LogPrint } from 'bilitoolkit-ui'
import { getErrorMessage } from '@ybgnb/utils'
import { BiliClient } from '@ybgnb/bili-api'
import { getBlackList } from '@/utils/black-user'
import { storeToRefs } from 'pinia'
import { exportBlackList } from '@/utils/file'

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

const handleStart = async () => {
  try {
    assertLoggedIn()
    const client = new BiliClient({
      context: {
        userCookie: user.value!.userCookie,
      },
    })
    const logger = (msg: string) => {
      addLog(msg)
    }
    const list = await getBlackList({
      client,
      logger,
    })
    if (list.length < 1) {
      addLog('黑名单为空')
      return
    }
    const fileName = await exportBlackList(user.value!, list)
    addLog(`成功导出文件：${fileName}`)
  } catch (e) {
    addLog(getErrorMessage(e))
  }
}
</script>

<template>
  <PluginPageContent
    ><div class="page-content">
      <div class="actions">
        <el-button @click="handleStart">导出黑名单</el-button>
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
