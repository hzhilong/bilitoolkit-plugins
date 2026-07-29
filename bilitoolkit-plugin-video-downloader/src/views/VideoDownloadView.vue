<script setup lang="ts">
import { publicClient } from 'bilitoolkit-runtime/biliapi'
import { parseVideoId } from '@ybgnb/bili-api'
import DownloadView from '@/components/video/DownloadView.vue'
import type { DownloadVideoData } from '@/types/download'

const fetchVideos = async (url: string) => {
  const videoId = await parseVideoId(url)
  const videoInfo = await publicClient.videoInfo.getInfo(videoId)
  return [videoInfo]
}
const getTitle = (list: DownloadVideoData[]) => {
  return list[0].video.title
}
</script>

<template>
  <DownloadView
    placeholder="请输入B站视频链接 / b23分享链接 / BV号 / av号"
    :fetchVideos="fetchVideos"
    :getTitle="getTitle"
  ></DownloadView>
</template>

<style scoped lang="scss"></style>
