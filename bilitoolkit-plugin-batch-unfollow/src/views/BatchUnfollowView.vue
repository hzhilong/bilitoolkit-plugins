<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { PluginPageContent, useSelectedUserStore, LogPrint, QueryFormItem } from 'bilitoolkit-ui'
import { getErrorMessage } from '@ybgnb/utils'
import { BiliClient } from '@ybgnb/bili-api'
import { getFollowTag, getFollowList, batchUnfollow } from '@/utils/follow'
import { storeToRefs } from 'pinia'

let userStore = useSelectedUserStore()
const { assertLoggedIn } = userStore
const { user } = storeToRefs(userStore)
const loggerRef = useTemplateRef<InstanceType<typeof LogPrint>>('loggerRef')
const pageSize = new BiliClient().relation.buildFollowingsPager(1).getPageSize()
const batchSizes = Array.from({ length: 20 }).map((_, i) => (i + 1) * pageSize)
const batchSize = ref(pageSize * 5)

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
    const tags = await getFollowTag({ client })
    const logger = (msg: string) => {
      addLog(msg)
    }
    const list = await getFollowList(tags, {
      client,
      maxSize: batchSize.value,
      logger,
    })
    if (list.length < 1) return
    await batchUnfollow(list, { client, logger })
  } catch (e) {
    addLog(getErrorMessage(e))
  }
}
</script>

<template>
  <PluginPageContent
    ><div class="page-content">
      <div class="actions">
        <QueryFormItem prefix="取关上限" style="width: fit-content">
          <el-select v-model="batchSize" style="width: 92px">
            <el-option v-for="size in batchSizes" :key="size" :label="size" :value="size" />
          </el-select>
        </QueryFormItem>
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
