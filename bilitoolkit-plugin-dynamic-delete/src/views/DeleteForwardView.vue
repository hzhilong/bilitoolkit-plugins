<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { PluginPageContent, useSelectedUserStore, LogPrint, showConfirm } from 'bilitoolkit-ui'
import { storeToRefs } from 'pinia'
import { publicClient } from 'bilitoolkit-runtime/biliapi'
import type { OnPageFetched, Dynamic } from '@ybgnb/bili-api'
import { sleepRandom, getErrorMessage } from '@ybgnb/utils'
import { isLotteryDynamic } from '@/utils/dynamic'

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

function truncateText(text: string, maxLength: number, placeholder: string = '...'): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + placeholder
}

const handleDelete = async () => {
  if (isDeleting.value) {
    abortController?.abort()
    isDeleting.value = false
    return
  }
  try {
    assertLoggedIn()

    await showConfirm('确定删除所选类型的所有动态吗？')
    await showConfirm('确定清空吗')
    isDeleting.value = true
    let successCount = 0
    abortController = new AbortController()
    const bizOptions = {
      signal: abortController.signal,
    }
    addLog(`正在获取动态`)
    const onPageFetched: OnPageFetched<Dynamic> = async (currList: Dynamic[], _list: Dynamic[]) => {
      if (currList == null || currList.length === 0) return false

      addLog(`已获取 ${currList.length} 条动态`)
      for (const dynamic of currList) {
        if (bizOptions.signal.aborted) return false
        if (dynamic.type !== 'DYNAMIC_TYPE_FORWARD') continue

        const forwardDynamic = dynamic.orig
        const forwardDynamicContent = forwardDynamic?.modules.module_dynamic.major?.opus?.summary.text
        const authorName = forwardDynamic?.modules.module_author.name
        const title = (dynamic.modules.module_dynamic.desc?.text || forwardDynamicContent) ?? dynamic.id_str

        if (!isOnlyDeleteLottery.value || isLotteryDynamic(dynamic)) {
          try {
            await publicClient.spaceDynamic.deleteDynamic(dynamic.id_str, bizOptions)
          } catch (e) {
            addLog(`删除动态失败 ${getErrorMessage(e)}：【${truncateText(title, 20)}】 转发☞ 【${authorName}】`)
            throw e
          }

          successCount++
          addLog(`成功删除动态：【${truncateText(title, 20)}】 转发☞ 【${authorName}】`)
          if (bizOptions.signal.aborted) return false
          await sleepRandom(1122, 2233)
        }
      }
      return true
    }
    await publicClient.spaceDynamic.fetchAll({ host_mid: user.value!.mid }, undefined, onPageFetched, bizOptions)
    if (successCount > 0) {
      addLog(`成功删除 ${successCount} 条动态`)
    } else {
      addLog(`未找到符合条件的转发动态`)
    }
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
        <el-button type="primary" @click="handleDelete">{{
          isDeleting ? '停止删除动态' : '删除转发的所有动态'
        }}</el-button>
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
