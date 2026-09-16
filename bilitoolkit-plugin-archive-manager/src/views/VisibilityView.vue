<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import {
  PluginPageContent,
  useSelectedUserStore,
  LogPrint,
  QueryFormItem,
  loadingDialog,
  showConfirm,
  showVirtualSelectDialog,
} from 'bilitoolkit-ui'
import { getErrorMessage, sleepRandom, isCanceledError } from '@ybgnb/utils'
import { BiliClient, type MyArcAuditItem } from '@ybgnb/bili-api'
import { AppError } from 'bilitoolkit-types'
import { storeToRefs } from 'pinia'
import { useAppSettingsStore } from '@/stores/app-settings'

const userStore = useSelectedUserStore()
const { user } = storeToRefs(userStore)
const { appSettings } = storeToRefs(useAppSettingsStore())
const { assertLoggedIn } = userStore
const loggerRef = useTemplateRef<InstanceType<typeof LogPrint>>('loggerRef')

const onlySelf = ref<boolean>(true)
const mode = ref<'batch' | 'manual'>('manual')
const running = ref(false)
let abortController: AbortController | null = null

const addLog = (msg: string) => {
  loggerRef.value?.addLog(msg)
}

const clearLog = () => {
  loggerRef.value?.reset()
}

const handleStart = async () => {
  try {
    assertLoggedIn()

    if (mode.value === 'batch') {
      await showConfirm(`当前操作方式会修改所有稿件的可见性，是否继续？`)
      await showConfirm(`再次确认：将修改所有稿件的可见性，是否继续？`)
    }

    running.value = true
    abortController = new AbortController()
    let signal = abortController.signal
    const client = new BiliClient({
      context: {
        userCookie: user.value!.userCookie,
      },
    })

    const changeVisibility = async (aid: number) => {
      await client.myArchive.changeVisibility(
        {
          aid,
          onlySelf: onlySelf.value,
        },
        { signal },
      )
    }

    const minDelay = appSettings.value.businessRequestIntervalMinMs
    const maxDelay = appSettings.value.businessRequestIntervalMaxMs
    const apiSleep = async () => {
      await sleepRandom(minDelay, maxDelay, signal)
    }

    let list: Array<MyArcAuditItem & { aid: number }> = []

    try {
      await client.myArchive.fetchAll(
        {},
        { pageSize: 100 },
        async (currList) => {
          if (!currList || currList.length === 0) return false

          for (const item of currList) {
            const { bvid, aid, title, is_only_self: isOnlySelf } = item.Archive
            addLog(`已获取稿件：${bvid} ${title} ${isOnlySelf === 1 ? '仅自己可见' : '公开可见'}`)
            if (onlySelf.value !== (isOnlySelf === 1)) {
              list.push({ ...item, aid: aid })
            }
          }
        },
        {
          signal,
          minDelay,
          maxDelay,
        },
      )
    } catch (e) {
      if (list.length <= 0) {
        throw e
      }
      addLog(`${getErrorMessage(e)}`)

      if (isCanceledError(e)) {
        abortController = new AbortController()
        signal = abortController.signal
        await showConfirm(`已获取${list.length}个视频，是否修改为${onlySelf.value ? '仅自己可见' : '公开可见'}？`)
      } else {
        await showConfirm(
          `获取稿件列表时遇到错误，已获取${list.length}个视频，是否修改为${onlySelf.value ? '仅自己可见' : '公开可见'}？`,
        )
      }
    }

    if (list.length === 0) {
      throw new AppError(`未找到可见性为[${!onlySelf.value ? '仅自己可见' : '公开可见'}]的稿件`)
    }

    if (mode.value === 'manual') {
      list =
        (await showVirtualSelectDialog({
          options: list,
          getDataLabel: (data) => `${data.Archive.bvid} ${data.Archive.title}`,
          canSelectAll: true,
          multiple: true,
          idKey: 'aid',
          itemWidth: 500,
        })) ?? []
      if (!list || list.length === 0) {
        throw new AppError('未选择稿件')
      }
    }

    addLog(`处理中...`)
    for (let i = 0; i < list.length; i++) {
      const item = list[i]
      if (signal.aborted) break

      const { bvid, aid, title } = item.Archive
      await changeVisibility(aid)
      addLog(`\t已更改[${bvid} ${title}]为：${onlySelf.value ? '仅自己可见' : '公开可见'}`)
      if (i < list.length - 1) {
        await apiSleep()
      }
    }
    addLog(`操作完成，共修改${list.length}个视频稿件`)
  } catch (e) {
    addLog(getErrorMessage(e))
  } finally {
    abortController = null
    running.value = false
    addLog('--------------')
  }
}

const handleStop = async () => {
  try {
    loadingDialog.show('取消中')
    abortController?.abort()
  } finally {
    abortController = null
    running.value = false
    loadingDialog.close()
    addLog('已取消')
  }
}
</script>

<template>
  <PluginPageContent>
    <div class="page-content">
      <div class="actions">
        <QueryFormItem prefix="修改为：" style="width: fit-content">
          <el-radio-group v-model="onlySelf" style="width: fit-content; padding: 0 20px">
            <el-radio label="仅自己可见" :value="true" />
            <el-radio label="公开可见" :value="false" />
          </el-radio-group>
        </QueryFormItem>
      </div>
      <div class="actions">
        <QueryFormItem prefix="操作方式" style="width: fit-content">
          <el-radio-group v-model="mode" style="width: fit-content; padding: 0 20px">
            <el-radio label="批量修改所有稿件" value="batch" />
            <el-radio label="手动选择稿件" value="manual" />
          </el-radio-group>
        </QueryFormItem>
        <el-button v-if="!running" type="primary" @click="handleStart">开始</el-button>
        <el-button v-if="running" type="primary" @click="handleStop">停止</el-button>
        <el-button type="primary" @click="clearLog">清空日志</el-button>
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
