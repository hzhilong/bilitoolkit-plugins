<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import {
  PluginPageContent,
  useSelectedUserStore,
  LogPrint,
  showError,
  useLoadingData,
  AppTooltip,
  getUserAvatarThumbnail,
  showConfirm,
} from 'bilitoolkit-ui'
import { getErrorMessage } from '@ybgnb/utils'
import { BiliClient, type Relation } from '@ybgnb/bili-api'
import { storeToRefs } from 'pinia'
import { importBlackList } from '@/utils/file'
import { batchBlock, getBlackList } from '@/utils/black-user'
import { RecycleScroller } from 'vue-virtual-scroller'

const userStore = useSelectedUserStore()
const { assertLoggedIn } = userStore
const { user } = storeToRefs(userStore)

const { loading, loadingData } = useLoadingData()
const blackListKey = ref(0)
const blackList = ref<Relation[]>()

const addLog = (msg: string) => {
  loggerRef.value?.addLog(msg)
}
const handleClearLog = () => {
  loggerRef.value?.reset()
}

const handleImportedData = async (data: Relation[]) => {
  blackListKey.value++
  blackList.value = data
  addLog(`成功导入 ${data.length} 个黑名单`)
}

const loggerRef = useTemplateRef<InstanceType<typeof LogPrint>>('loggerRef')
const fileInputRef = useTemplateRef<HTMLInputElement>('fileInputRef')

const triggerUpload = () => fileInputRef.value?.click()
const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = loadingData(async (e) => {
    try {
      await handleImportedData(await importBlackList(e.target?.result as string))
    } catch (e) {
      showError(`导出json文件出错：${getErrorMessage(e)}`)
    }
  })
  reader.readAsText(file)
  input.value = ''
}

const handleBatchBlock = async () => {
  try {
    if (!blackList.value || blackList.value.length === 0) {
      showError(`黑名单列表为空`)
      return
    }
    assertLoggedIn()
    await showConfirm('确认拉黑该名单内所有用户吗？')
    let isGetSelfBlackList = false
    try {
      await showConfirm('是否先获取自己的黑名单？防止重复拉黑', undefined, {
        cancelButtonText: '否',
        confirmButtonText: '是',
      })
      isGetSelfBlackList = true
    } catch {}
    const client = new BiliClient({
      context: {
        userCookie: user.value!.userCookie,
      },
    })
    const logger = (msg: string) => {
      addLog(msg)
    }

    let list = [...blackList.value]
    if (isGetSelfBlackList) {
      const selfList = new Set((await getBlackList({ client, logger })).map((item) => item.mid))
      list = list.filter((b) => !selfList.has(b.mid))
      logger(`去重已拉黑的黑名单数量：${list.length}`)
      if (list.length < 1) return
    }

    await batchBlock(list, { client, logger })
  } catch (e) {
    addLog(getErrorMessage(e))
  }
}
</script>

<template>
  <PluginPageContent v-loading="loading">
    <div class="page-content">
      <div class="actions">
        <input
          ref="fileInputRef"
          type="file"
          accept=".json,application/json"
          style="display: none"
          @change="handleFileChange"
        />
        <div class="header-actions">
          <el-button @click="triggerUpload" type="primary">导入黑名单</el-button>
          <el-button v-if="blackList && blackList.length > 0" @click="handleBatchBlock">批量拉黑名单里的用户</el-button>
          <el-button @click="handleClearLog">清空日志</el-button>
        </div>
      </div>
      <LogPrint ref="loggerRef" class="log-print-box"></LogPrint>
      <div class="table-container" v-if="blackList && blackList.length > 0">
        <div class="table-header">
          <div class="col">序号</div>
          <div class="col">uid</div>
          <div class="col"></div>
          <div class="col uname">用户</div>
          <div class="col">空间签名</div>
        </div>
        <div class="table-body-wrapper">
          <RecycleScroller
            class="table-body"
            :key="blackListKey"
            :items="blackList"
            :item-size="26"
            key-field="mid"
            v-slot="{ item, index }: { item: Relation; index: number }"
          >
            <div class="table-row">
              <div class="col">{{ index + 1 }}</div>
              <div class="col">{{ item.mid }}</div>
              <img class="col face" :src="getUserAvatarThumbnail(item.face)" alt="face" loading="lazy" />
              <AppTooltip class="col" :content="item.uname"></AppTooltip>
              <AppTooltip class="col" :content="item.sign"></AppTooltip>
            </div>
          </RecycleScroller>
        </div>
      </div>
    </div>
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

  .actions {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .log-print-box {
    width: 100%;
    height: 100px;
  }

  .table-container {
    width: 100%;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;

    .table-body-wrapper {
      width: 100%;
      flex: 1;
      min-height: 0;
      .table-body {
        position: relative;
        height: 100%;
        overflow-y: auto;
      }
    }

    ::v-deep(.vue-recycle-scroller__item-view) {
      width: 100%;
    }

    .table-header,
    .table-row {
      display: grid;
      grid-template-columns: 44px 160px 50px 2fr 4fr;
      align-items: center;
      width: 100%;
      border-bottom: 1px solid var(--el-border-color);
    }

    .table-header {
      font-weight: bold;
      padding-right: 8px;

      .col.uname {
        text-align: left;
      }
    }

    .col {
      height: 26px;
      line-height: 26px;
      font-size: 14px;
      text-align: center;

      &.face {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        margin: 0 auto;
      }
    }
  }
}
</style>
