<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { PluginPageContent, useSelectedUserStore, LogPrint } from 'bilitoolkit-ui'
import { storeToRefs } from 'pinia'
import { publicClient } from 'bilitoolkit-runtime/biliapi'
import { getErrorMessage } from '@ybgnb/utils'
import { isLotteryDynamic, deleteFilterDynamics } from '@/utils/dynamic'

const userStore = useSelectedUserStore()
const { assertLoggedIn } = userStore
const { user } = storeToRefs(userStore)
const loggerRef = useTemplateRef<InstanceType<typeof LogPrint>>('loggerRef')

const isOnlyDeleteLottery = ref(true)
const isDeleting = ref(false)
let abortController: AbortController | null = null

const addLog = (msg: string) => {
  loggerRef.value?.addLog(msg)
}

const handleDelete = async () => {
  if (isDeleting.value) {
    abortController?.abort()
    isDeleting.value = false
    return
  }
  try {
    assertLoggedIn()
    isDeleting.value = true
    abortController = new AbortController()

    await deleteFilterDynamics(
      {
        client: publicClient,
        addLog: addLog,
        signal: abortController.signal,
        currUid: user.value!.mid!,
      },
      (dynamic) => {
        if (dynamic.type !== 'DYNAMIC_TYPE_FORWARD' || dynamic.orig == null) return false
        return !isOnlyDeleteLottery.value || isLotteryDynamic(dynamic)
      },
      (dynamic) => {
        const forwardDynamic = dynamic.orig!
        const forwardDynamicContent = forwardDynamic.modules.module_dynamic.major?.opus?.summary.text
        const authorName = forwardDynamic.modules.module_author.name
        const descText = dynamic.modules.module_dynamic.desc?.text
        const title = descText ?? `-未识别的动态-`
        if (forwardDynamicContent) {
          return `转发 [${authorName}] [${title}] [${forwardDynamicContent}]`
        } else {
          return `转发 [${authorName}] [${title}]`
        }
      },
      800,
    )
  } catch (e) {
    addLog(getErrorMessage(e))
  } finally {
    abortController?.abort()
    isDeleting.value = false
  }
}
</script>

<template>
  <PluginPageContent>
    <div class="page-content">
      <div class="actions">
        <el-checkbox v-model="isOnlyDeleteLottery" label="仅删除官方的抽奖动态" />
        <el-button type="primary" @click="handleDelete">{{ isDeleting ? '停止操作' : '查询转发的所有动态' }}</el-button>
      </div>
      <LogPrint ref="loggerRef" class="log-print-box"></LogPrint>
    </div>
  </PluginPageContent>
</template>

<style scoped lang="scss">
.page-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
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
