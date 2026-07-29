<script setup lang="ts">
import { AppError } from 'bilitoolkit-types'
import { publicClient } from 'bilitoolkit-runtime/biliapi'
import { parseVideoId, av2bv, type VideoUgcSeason } from '@ybgnb/bili-api'
import DownloadView from '@/components/video/DownloadView.vue'
import type { DownloadVideoData } from '@/types/download'
import { ref } from 'vue'

const collection = ref<VideoUgcSeason>()
const fetchVideos = async (url: string) => {
  const videoId = await parseVideoId(url)
  const videoInfo = await publicClient.videoInfo.getInfo(videoId)

  if (!videoInfo.ugc_season?.title) {
    throw new AppError('未找到合集')
  }

  const episodes = videoInfo.ugc_season.sections.map((s) => s.episodes).flat()

  if (episodes.length == 0) {
    throw new AppError('合集视频为空')
  }

  collection.value = videoInfo.ugc_season

  for (const item of episodes) {
    item.arc.owner = item.arc.author!
    item.arc.bvid = av2bv(item.arc.aid)
    item.arc.pages = item.pages
  }

  return episodes.map((e) => e.arc)
}

const getTitle = (_list: DownloadVideoData[]) => {
  return `【合集】${collection.value!.title}`
}
</script>

<template>
  <DownloadView
    placeholder="请输入存在于合集的B站视频链接 / b23分享链接 / BV号 / av号"
    :fetchVideos="fetchVideos"
    :getTitle="getTitle"
  ></DownloadView>
</template>

<style scoped lang="scss"></style>
