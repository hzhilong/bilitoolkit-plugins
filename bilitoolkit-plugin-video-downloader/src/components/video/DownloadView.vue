<script setup lang="ts">
import { PluginPageContent, useSelectedUserStore, loadingDialog } from 'bilitoolkit-ui'
import { Search } from '@element-plus/icons-vue'
import { ref } from 'vue'
import { type VideoInfo } from '@ybgnb/bili-api'
import VideoResourceDialog from '@/components/video/VideoResourceDialog.vue'
import type { DownloadVideoData } from '@/types/download'
import { storeToRefs } from 'pinia'
import { useAppSettingsStore } from '@/stores/app-settings'
import { createDownloadTasks } from '@/utils/download'
import { useFileNamerSettingsStore } from '@/stores/file-namer-settings'
import { cloneDeep } from 'lodash-es'

const props = defineProps<{
  placeholder: string
  fetchVideos: (url: string) => Promise<VideoInfo[]>
  getTitle: (list: DownloadVideoData[]) => string
}>()

const url = ref('')
const selectedUserStore = useSelectedUserStore()
const { assertLoggedIn } = selectedUserStore
const { user } = storeToRefs(selectedUserStore)
const { appSettings } = storeToRefs(useAppSettingsStore())
const { settings: fileNamerSettings } = storeToRefs(useFileNamerSettingsStore())
const fetchVideo = async () => {
  assertLoggedIn()
  videos.value.splice(0, videos.value.length, ...(await props.fetchVideos(url.value)))
  visible.value = true
}
const visible = ref(false)
const videos = ref<VideoInfo[]>([])
const handleSubmit = async (list: DownloadVideoData[]) => {
  try {
    loadingDialog.show()
    await createDownloadTasks(
      {
        appSettings: appSettings.value,
        user: cloneDeep(user.value!),
        fileNamerSettings: fileNamerSettings.value,
      },
      list,
      props.getTitle(list),
    )
  } finally {
    loadingDialog.close()
  }
}
</script>

<template>
  <plugin-page-content class="page-content">
    <div class="downloader-container">
      <img src="../../../public/icon.png" alt="logo" width="128" height="128" />
      <el-input v-model="url" style="max-width: 70%" :placeholder="placeholder">
        <template #append>
          <el-button :icon="Search" @click="fetchVideo" />
        </template>
      </el-input>
    </div>
    <VideoResourceDialog :videos="videos" v-model="visible" @submit="handleSubmit" />
  </plugin-page-content>
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
