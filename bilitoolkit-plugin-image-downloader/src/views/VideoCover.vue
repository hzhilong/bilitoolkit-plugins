<script setup lang="ts">
import { ref } from 'vue'
import { parseVideoId, av2bv } from '@ybgnb/bili-api'
import { client } from '@/common/client'
import type { ImageInfo } from '@/types/types'
import { AppError } from 'bilitoolkit-types'

const url = ref('')
const fetchImages = async (): Promise<ImageInfo[]> => {
  const list: ImageInfo[] = []
  const videoId = await parseVideoId(url.value)
  let bvid = videoId.bvid!
  if (videoId.aid) {
    bvid = av2bv(videoId.aid)
  }
  const cards = await client.api.get('https://api.bilibili.com/x/article/cards', {
    query: {
      ids: bvid,
      web_location: '333.1305',
    },
  })
  const videoInfo = cards[bvid]
  if (!videoInfo) {
    throw new AppError('视频不存在')
  }
  const cover = cards[bvid].pic
  const cover43 = cards[bvid].cover43
  if (cover43 && cover43 !== cover) {
    list.push({
      url: cover43,
      fileName: `视频封面/${bvid}_${videoInfo.title}_4-3`,
    })
  }
  list.push({
    url: cover,
    fileName: `视频封面/${bvid}_${videoInfo.title}`,
  })
  return list
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
