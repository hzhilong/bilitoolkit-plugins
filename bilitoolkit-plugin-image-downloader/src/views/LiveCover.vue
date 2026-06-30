<script setup lang="ts">
import { ref } from 'vue'
import { parseUID } from '@ybgnb/bili-api'
import { client } from '@/common/client'
import type { ImageInfo } from '@/types/types'
import { AppError } from 'bilitoolkit-types'
import { getFormattedDate } from '@ybgnb/utils'

const url = ref('')
const fetchImages = async (): Promise<ImageInfo> => {
  const uid = await parseUID(url.value)
  const roomInfo = await client.live.getRoomInfo(uid)
  if (roomInfo.live_status === 0) {
    throw new AppError('该用户未开播')
  }
  return {
    url: roomInfo.cover,
    fileName: `直播封面/${roomInfo.roomid}_${roomInfo.title}_${getFormattedDate()}`,
  }
}
</script>

<template>
  <ImageDownload typeName="直播封面" :fetchImages="fetchImages">
    <el-input v-model.trim="url" placeholder="请输入用户链接 / b23分享链接 / 用户UID">
      <template #prepend> 用户链接 </template>
    </el-input>
  </ImageDownload>
</template>

<style scoped lang="scss"></style>
