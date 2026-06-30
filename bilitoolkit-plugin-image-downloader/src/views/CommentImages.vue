<script setup lang="ts">
import { ref } from 'vue'
import { client } from '@/common/client'
import type { ImageInfo } from '@/types/types'
import { getFileName } from '@/utils/download'

const url = ref('')
const fetchImages = async (): Promise<ImageInfo[] | void> => {
  const commentItem = (await client.comment.resolveCommentItem(url.value)) ?? undefined
  if (!commentItem) return []

  const list: ImageInfo[] = []
  const emote = commentItem.content.emote
  const parentDir = `评论图片和表情包/${commentItem.rpid_str}`
  if (emote) {
    list.push(
      ...Object.values(emote).map((r) => ({
        url: r.gif_url ?? r.url,
        fileName: `${parentDir}/${r.text}`,
      })),
    )
  }
  const pictures = commentItem.content.pictures
  if (pictures) {
    list.push(
      ...Object.values(pictures).map((r) => ({
        url: r.img_src,
        fileName: `${parentDir}/${getFileName(r.img_src)}`,
      })),
    )
  }
  return list
}
</script>

<template>
  <ImageDownload typeName="表情包和图片" :fetchImages="fetchImages">
    <el-input v-model.trim="url" placeholder="请输入评论链接 / b23分享链接 （视频/动态/专栏底下的评论）">
      <template #prepend> 评论链接 </template>
    </el-input>
  </ImageDownload>
</template>

<style scoped lang="scss"></style>
