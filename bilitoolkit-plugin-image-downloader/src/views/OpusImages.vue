<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ref } from 'vue'
import { parseOpusId } from '@ybgnb/bili-api'
import { client } from '@/common/client'
import type { ImageInfo } from '@/types/types'
import { getFileName } from '@/utils/download'

const url = ref('')

const fetchImages = async (): Promise<ImageInfo[] | void> => {
  const id = await parseOpusId(url.value)
  const opusDetail = await client.opus.getDetail({ id })
  const modules = (opusDetail.item.modules ?? []) as any[]
  const list: ImageInfo[] = []
  for (const module of modules) {
    if (module.module_type === 'MODULE_TYPE_CONTENT') {
      const title = opusDetail!.item.basic.title.split(' - 哔哩哔哩')[0]
      const parentDir = `专栏图片和表情包/${opusDetail?.item.id_str}_${title}`
      const paragraphs = module.module_content?.paragraphs ?? []
      list.push(
        ...paragraphs
          .filter((p: any) => p.para_type === 2 && p.pic?.pics != null)
          .map((p: any) => [...p.pic.pics.map((pi: any) => pi.url)])
          .flat()
          .map((p: string) => ({ url: p, fileName: `${parentDir}/${getFileName(p)}` })),
      )
      list.push(
        ...paragraphs
          .filter((p: any) => p.para_type === 1 && p.text?.nodes != null)
          .map((p: any) => [
            ...p.text?.nodes
              .filter((pd: any) => pd.type === 'TEXT_NODE_TYPE_RICH' && pd.rich && pd.rich.emoji != null)
              .map((pd: any) => pd.rich.emoji),
          ])
          .flat()
          .map((pe: any) => ({
            url: pe.gif_url ?? pe.icon_url,
            fileName: `${parentDir}/${pe.text}`,
          })),
      )
    }
  }
  return list
}
</script>

<template>
  <ImageDownload typeName="表情包和图片" :fetchImages="fetchImages">
    <el-input v-model.trim="url" placeholder="请输入专栏链接 / b23分享链接">
      <template #prepend> 专栏链接 </template>
    </el-input>
  </ImageDownload>
</template>

<style scoped lang="scss"></style>
