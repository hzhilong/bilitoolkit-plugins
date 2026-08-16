<script setup lang="ts">
import { PluginPageContent, useLoadingData, showWarning, useSelectedUserStore } from 'bilitoolkit-ui'
import { ref, useTemplateRef } from 'vue'
import type { ImageInfo, ImageElInfo } from '@/types/types'
import { downloadImages } from '@/utils/download'
import { AppError } from 'bilitoolkit-types'
import { getErrorMessage } from '@ybgnb/utils'

const props = defineProps<{
  typeName: string
  fetchImages: () => Promise<ImageInfo[] | ImageInfo | void>
}>()
const images = ref<ImageInfo[]>([])
const { loading, loadingData } = useLoadingData()
const { assertLoggedIn } = useSelectedUserStore()
const imagesContainerRef = useTemplateRef<HTMLDivElement>('imagesContainerRef')

const handleFetchImages = loadingData(async () => {
  assertLoggedIn()
  try {
    const img = (await props.fetchImages()) ?? []
    if (Array.isArray(img)) {
      images.value = img
    } else {
      images.value = [img]
    }
    if (images.value.length === 0) {
      showWarning(`${props.typeName}为空`)
    }
  } catch (error) {
    throw new AppError(`获取${props.typeName}失败：${getErrorMessage(error)}`)
  }
})
const saveImages = loadingData(async () => {
  const imgList = imagesContainerRef.value?.querySelectorAll('img')
  if (!imgList || !imgList.length) {
    showWarning(`图片为空`)
    return
  }

  const infoList: ImageElInfo[] = []
  for (let i = 0; i < imgList.length; i++) {
    const img = imgList[i]
    infoList.push({
      url: img.src,
      fileName: img.dataset.fileName ?? crypto.randomUUID(),
      complete: img.complete,
    })
  }
  await downloadImages(infoList)
})
const isVideo = (url: string) => {
  const clean = url.split('?')[0].split('#')[0]
  const ext = clean.split('.').pop()?.toLowerCase()
  return ext && ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv'].includes(ext)
}
</script>

<template>
  <PluginPageContent class="page" v-loading="loading">
    <div class="action-section">
      <slot></slot>
      <el-button type="primary" @click="handleFetchImages">获取{{ typeName }}</el-button>
      <el-button v-if="images.length > 0" type="primary" @click="saveImages()">保存{{ typeName }}</el-button>
    </div>
    <div class="images-container" ref="imagesContainerRef">
      <template v-for="item in images" :key="item.url">
        <video v-if="isVideo(item.url)" :src="item.url" autoplay loop muted playsinline></video>
        <img v-else :src="item.url" :alt="item.fileName" :data-file-name="item.fileName" loading="lazy" />
      </template>
    </div>
  </PluginPageContent>
</template>

<style scoped lang="scss">
::v-deep(.action-section) {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;

  .el-button + .el-button {
    margin-left: 0 !important;
  }
}

::v-deep(.images-container) {
  display: flex;
  flex-wrap: wrap;
  overflow-y: auto;
  gap: 10px;

  > video:only-child,
  > img:only-child {
    max-width: 100%;
  }

  > video,
  > img {
    max-width: 150px;
  }
}
</style>
