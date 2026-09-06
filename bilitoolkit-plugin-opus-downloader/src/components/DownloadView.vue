<script setup lang="ts">
import {
  useLoadingTask,
  PluginPageContent,
  useSelectedUserStore,
  toolkitApi,
  loadingDialog,
  showToast,
} from 'bilitoolkit-ui'
import { ref } from 'vue'
import { Search } from '@element-plus/icons-vue'
import type { OptContext } from '@/types/context'
import { storeToRefs } from 'pinia'
import { useAppSettingsStore } from '@/stores/app-settings'
import { useFileNamerSettingsStore } from '@/stores/file-namer-settings'
import { BiliClient, type OpusDetail } from '@ybgnb/bili-api'
import { createAbortError, sleepRandom } from '@ybgnb/utils'
import { AppError } from '../../../../bilitoolkit-types'
import { downloadOpus } from '@/utils/download'
import { result } from 'lodash-es'
import type { DownloadResult } from '@/types/download'
import { createFileNamer } from '@/utils/file'

const props = defineProps<{
  placeholder: string
  autoOpenFolder: boolean
  fetchOpusList: (context: OptContext, url: string) => Promise<OpusDetail[]>
  onDownloaded?: (list: DownloadResult[], context: OptContext) => Promise<void>
}>()

const selectedUserStore = useSelectedUserStore()
const { assertLoggedIn } = selectedUserStore
const { user } = storeToRefs(selectedUserStore)
const { appSettings } = storeToRefs(useAppSettingsStore())
const { settings: fileNamerSettings } = storeToRefs(useFileNamerSettingsStore())
const url = ref<string>('')

const updateLoading = (msg: string) => {
  loadingDialog.show({
    message: msg,
  })
}

const { execTask } = useLoadingTask(async ({ signal }) => {
  const context = {
    //    client: await createBiliClient(user.value!),
    client: new BiliClient({
      context: {
        userCookie: user.value!.userCookie,
      },
    }),
    fileNamer: createFileNamer(fileNamerSettings.value),
    appSettings: appSettings.value,
    user: user.value!,
    signal,
  }

  updateLoading('正在获取专栏数据')
  const list = await props.fetchOpusList(context, url.value)
  if (signal.aborted) throw createAbortError()

  if (!list || list.length === 0) throw new AppError('未找到专栏')

  let firstFilePath: string | null = null
  const allResult: DownloadResult[] = []
  for (let i = 0; i < list.length; i++) {
    const item = list[i]
    const title = item.item.basic.title.split(' - 哔哩哔哩')[0]
    if (list.length > 1) {
      updateLoading(`${i + 1}/${list.length} 正在下载专栏：${title}`)
    } else {
      updateLoading(`正在下载专栏：${title}`)
    }
    const resultList = await downloadOpus(context, item)
    if (i < result.length - 1) {
      await sleepRandom(1122, 2555, signal)
    }
    allResult.push(resultList)
    if (firstFilePath == null && resultList && result.length > 0) {
      firstFilePath = resultList.fileList[0].filePath
    }
  }

  if (signal.aborted) throw createAbortError()

  if (firstFilePath == null) throw new AppError('内部错误，插件设置中转换的资源格式为空')

  if (props.autoOpenFolder) {
    await toolkitApi.system.showItemInPluginFolder(firstFilePath)
  }

  await props.onDownloaded?.(allResult, context)

  showToast('专栏下载成功')
})

const startExec = async () => {
  assertLoggedIn()
  await execTask()
}
</script>

<template>
  <PluginPageContent class="page-content">
    <div class="downloader-container">
      <img src="../../public/icon.png" alt="logo" :width="128" :height="128" />
      <el-input v-model="url" style="max-width: 70%" :placeholder="placeholder">
        <template #append>
          <el-button :icon="Search" @click="startExec" />
        </template>
      </el-input>
    </div>
  </PluginPageContent>
</template>

<style scoped lang="scss">
.downloader-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 20px;
  margin-top: -100px;
}
</style>
