<script setup lang="ts">
import { PluginPageContent, useSelectedUserStore } from 'bilitoolkit-ui'
import { Search } from '@element-plus/icons-vue'
import { ref } from 'vue'
import { publicClient } from 'bilitoolkit-runtime/biliapi'
import { parseVideoId, type VideoInfo } from '@ybgnb/bili-api'
import VideoResourceDialog from '@/components/dialog/VideoResourceDialog.vue'
import type { DownloadVideoData } from '@/types/download'
import { storeToRefs } from 'pinia'
import { useAppSettingsStore } from '@/stores/app-settings'
import { createDownloadTasks } from '@/utils/download'
import { useFileNamerSettingsStore } from '@/stores/file-namer-settings'
import { cloneDeep } from 'lodash-es'

const url = ref('')
const selectedUserStore = useSelectedUserStore()
const { assertLoggedIn } = selectedUserStore
const { user } = storeToRefs(selectedUserStore)
const { appSettings } = storeToRefs(useAppSettingsStore())
const { settings: fileNamerSettings } = storeToRefs(useFileNamerSettingsStore())
const fetchVideo = async () => {
  assertLoggedIn()
  const videoId = await parseVideoId(url.value)
  const videoInfo = await publicClient.videoInfo.getInfo(videoId)
  videos.value.splice(0, videos.value.length, videoInfo)
  visible.value = true
}
const visible = ref(false)
const videos = ref<VideoInfo[]>([])
const handleSubmit = async (list: DownloadVideoData[]) => {
  await createDownloadTasks(
    {
      appSettings: appSettings.value,
      user: cloneDeep(user.value!),
      fileNamerSettings: fileNamerSettings.value,
    },
    list,
    videos.value[0].title,
  )
}
</script>

<template>
  <plugin-page-content class="page-content">
    <div class="downloader-container">
      <img src="../../public/icon.png" alt="logo" width="128" height="128" />
      <el-input v-model="url" style="max-width: 70%" placeholder="请输入B站视频链接 / b23分享链接 / BV号 / av号">
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
