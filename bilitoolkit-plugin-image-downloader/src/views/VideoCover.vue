<script setup lang="ts">
import { ref } from 'vue'
import { parseVideoId } from '@ybgnb/bili-api'
import { client } from '@/common/client'
import type { ImageInfo } from '@/types/types'

const url = ref('')
const fetchImages = async (): Promise<ImageInfo> => {
  const videoId = await parseVideoId(url.value)
  const videoInfo = await client.videoInfo.getInfo(videoId)
  return {
    url: videoInfo.pic,
    fileName: `视频封面/${videoInfo.bvid}_${videoInfo.title}`,
  }
}
</script>

<template>
  <ImageDownload typeName="视频封面" :fetchImages="fetchImages">
    <el-input v-model.trim="url" placeholder="请输入B站视频链接 / b23分享链接 / BV号 / av号">
      <template #prepend> 视频链接 </template>
    </el-input>
  </ImageDownload>
</template>

<style scoped lang="scss"></style>
