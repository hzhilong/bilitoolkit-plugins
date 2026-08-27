<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { PluginPageContent, useSelectedUserStore, LogPrint, showConfirm, showVirtualSelectDialog } from 'bilitoolkit-ui'
import { getErrorMessage, sleep } from '@ybgnb/utils'
import { BiliClient, type Relation } from '@ybgnb/bili-api'
import { batchUnfollow, getAllFollows } from '@/utils/follow'
import { storeToRefs } from 'pinia'
import { AppError } from 'bilitoolkit-types'

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

    const allFollows = await getAllFollows({ client, logger })

    const cancelledList = allFollows.filter((r) => r.uname === '账号已注销')

    if (cancelledList.length === 0) throw new AppError('未找到已注销的关注用户')

    logger(`找到${cancelledList.length}个已注销的关注用户`)

    const selectedList = await showVirtualSelectDialog<Relation>({
      title: '请选择需要取关的用户',
      options: cancelledList,
      canSelectAll: true,
      multiple: true,
      idKey: 'mid',
      getDataLabel: (data: Relation) => `${data.uname}  ${data.mid}`,
    })

    if (!selectedList) return

    await showConfirm(`确定一键取关 ${selectedList.length} 个用户吗？`)
    await sleep(1000)
    await batchUnfollow(selectedList, { client, logger })
  } catch (e) {
    addLog(getErrorMessage(e))
  }
}
</script>

<template>
  <PluginPageContent
    ><div class="page-content">
      <div class="actions">
        <el-button @click="handleStart">开始</el-button>
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
