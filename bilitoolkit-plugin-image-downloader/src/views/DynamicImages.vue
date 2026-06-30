<script setup lang="ts">
import { ref } from 'vue'
import type { MajorOpusPic } from '@ybgnb/bili-api'
import { parseDynamicOid } from '@ybgnb/bili-api'
import { client } from '@/common/client'
import type { ImageInfo } from '@/types/types'
import { getFileName } from '@/utils/download'
import { getEmojisFromRichText, getPicsFromRichText } from '@/utils/rich-text'

const url = ref('')
const fetchImages = async (): Promise<ImageInfo[]> => {
  const oid = await parseDynamicOid(url.value)
  const dynamic = await client.dynamic.getDetail({ id: oid })
  const parentDir = `动态图片和表情包/${dynamic.id_str}`
  const list: ImageInfo[] = []
  const nodes = dynamic.modules.module_dynamic.desc?.rich_text_nodes ?? []
  list.push(...getEmojisFromRichText(nodes, parentDir))
  list.push(...getPicsFromRichText(nodes, parentDir))
  const pics: MajorOpusPic[] = dynamic.modules.module_dynamic.major?.opus?.pics ?? []
  list.push(...pics.map((p: MajorOpusPic) => ({ url: p.url, fileName: `${parentDir}/${getFileName(p.url)}` })))
  const summaryNodes = dynamic.modules.module_dynamic.major?.opus?.summary.rich_text_nodes ?? []
  list.push(...getEmojisFromRichText(summaryNodes, parentDir))
  list.push(...getPicsFromRichText(summaryNodes, parentDir))
  return list
}
</script>

<template>
  <ImageDownload typeName="表情包和图片" :fetchImages="fetchImages">
    <el-input v-model.trim="url" placeholder="请输入动态链接 / b23分享链接 / 动态oid">
      <template #prepend> 动态链接 </template>
    </el-input>
  </ImageDownload>
</template>

<style scoped lang="scss"></style>
