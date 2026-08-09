<script setup lang="ts">
import { ref, computed, useTemplateRef } from 'vue'
import { PluginPageContent, QueryFormItem, useSelectedUserStore, showError, LogPrint } from 'bilitoolkit-ui'
import { storeToRefs } from 'pinia'
import { useAppSettingsStore } from '@/stores/app-settings'
import PollConfigDialog from '@/components/PollConfigDialog.vue'
import type { PollConfig, PollResult } from '@/types'
import type { UserInfoWithCookie } from '@ybgnb/bili-api'
import type RealTimePoll from '@/components/RealTimePoll.vue'
import { cloneDeep } from 'lodash-es'
import { pollRecordRepo } from '@/db/repo/poll-record'

const userStore = useSelectedUserStore()
const { assertLoggedIn } = userStore
const { user } = storeToRefs(userStore)
const { appSettings } = storeToRefs(useAppSettingsStore())
const isCounting = ref(false)
const btnText = computed(() => (isCounting.value ? '停止投票' : '创建弹幕投票'))
const loggerRef = useTemplateRef<InstanceType<typeof LogPrint>>('loggerRef')
const realTimePollRef = useTemplateRef<InstanceType<typeof RealTimePoll>>('realTimePollRef')
const addLog = (msg: string) => {
  loggerRef.value?.addLog(msg)
}
const handleClearLog = () => {
  loggerRef.value?.reset()
}

const currRealTimeKey = ref<number>(2233)
const currPollConfig = ref<PollConfig>()
const currUser = ref<UserInfoWithCookie>()
const currRoomId = ref<number>()

const pollConfigDialogVisible = ref<boolean>(false)
const handleCreateConfig = async () => {
  if (isCounting.value) {
    if (realTimePollRef.value) {
      realTimePollRef.value.stop()
      addLog('连接已断开')
    }
    isCounting.value = false
    return
  }
  console.log(appSettings.value.roomId)
  if (!appSettings.value.roomId) {
    showError('请输入直播间id')
    return
  }
  assertLoggedIn()
  if (!isCounting.value) {
    pollConfigDialogVisible.value = true
    return
  }
}

const handleReconnectFailed = async () => {
  isCounting.value = false
  addLog(`重新建立连接失败`)
}
const handlePollFinished = async (result: PollResult) => {
  isCounting.value = false
  await pollRecordRepo.save({
    ...cloneDeep(result),
    createdAt: Math.floor(Date.now() / 1000),
  })
}

const handleSubmitConfig = async (config: PollConfig) => {
  realTimePollRef.value?.stop()
  currRealTimeKey.value++
  currPollConfig.value = cloneDeep(config)
  currUser.value = cloneDeep(user.value!)
  currRoomId.value = appSettings.value.roomId
  isCounting.value = true
}
</script>

<template>
  <PluginPageContent>
    <div class="page-content">
      <el-alert description="非官方弹幕投票，无法在B站直播间显示投票弹窗" />
      <div class="operating-section">
        <QueryFormItem prefix="直播间 id">
          <el-input v-model.number="appSettings.roomId" type="number" placeholder=""></el-input>
        </QueryFormItem>
        <el-button @click="handleCreateConfig" type="primary">{{ btnText }}</el-button>
        <el-button v-if="currPollConfig && currUser && currRoomId" @click="handleClearLog" type="primary"
          >清空日志</el-button
        >
      </div>
      <template v-if="currPollConfig && currUser && currRoomId">
        <div class="preview-section">
          <RealTimePoll
            ref="realTimePollRef"
            :key="currRealTimeKey"
            :config="currPollConfig"
            :user="currUser"
            :roomId="currRoomId"
            :logger="addLog"
            @finished="handlePollFinished"
            @reconnectFailed="handleReconnectFailed"
          />
          <LogPrint ref="loggerRef" class="log-print-box"></LogPrint>
        </div>
      </template>
    </div>
    <PollConfigDialog v-model="pollConfigDialogVisible" @submit="handleSubmitConfig"></PollConfigDialog>
  </PluginPageContent>
</template>

<style scoped lang="scss">
.page-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;

  .operating-section {
    width: fit-content;
    align-self: flex-start;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 10px;
  }

  .preview-section {
    flex: 1;
    min-height: 0;
    width: 100%;
    display: flex;
    align-items: flex-start;
    gap: 22px;

    .log-print-box {
      flex: 1;
      min-width: 0;
      height: 100%;
    }
  }
}
</style>
