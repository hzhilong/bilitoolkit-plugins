<script setup lang="ts">
import { ref } from 'vue'
import { PluginPageContent, useLoadingData } from 'bilitoolkit-ui'
import { parseVideoId, type VideoInfo } from '@ybgnb/bili-api'
import { client } from '@/common/client'
import { downloadCover, getFileSuffix } from '@/utils/download'

const { loading, loadingData } = useLoadingData()
const videoUrl = ref('')
const videoInfo = ref<VideoInfo>()
const fetchCover = loadingData(async () => {
  const videoId = await parseVideoId(videoUrl.value)
  videoInfo.value = await client.videoInfo.getInfo(videoId)
})
const saveCover = async () => {
  const src = videoInfo.value!.pic
  await downloadCover(src, `${videoInfo.value!.bvid}${getFileSuffix(src)}`)
}
</script>

<template>
  <PluginPageContent class="page" v-loading="loading">
    <div class="query-section">
      <el-input v-model.trim="videoUrl" placeholder="请输入B站视频链接 / b23分享链接 / BV号 / av号">
        <template #prepend> 视频链接 </template>
      </el-input>
      <el-button type="primary" @click="fetchCover">获取封面</el-button>
      <el-button v-if="videoInfo?.pic" type="primary" @click="saveCover()">保存封面</el-button>
    </div>
    <div class="cover-container">
      <img v-if="videoInfo?.pic" :src="videoInfo.pic" alt="cover" />
    </div>
  </PluginPageContent>
</template>

<style scoped lang="scss">
.query-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;

  ::v-deep(.el-button + .el-button) {
    margin-left: 0 !important;
  }
}
.cover-container {
  > img {
    width: 100%;
    height: 100%;
  }
}
</style>
