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
</script>

<template>
  <PluginPageContent class="page" v-loading="loading">
    <div class="action-section">
      <slot></slot>
      <el-button type="primary" @click="handleFetchImages">获取{{ typeName }}</el-button>
      <el-button v-if="images.length > 0" type="primary" @click="saveImages()">保存{{ typeName }}</el-button>
    </div>
    <div class="images-container" ref="imagesContainerRef">
      <img
        v-for="item in images"
        :src="item.url"
        :alt="item.fileName"
        :key="item.url"
        :data-file-name="item.fileName"
        loading="lazy"
      />
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

  > img:only-child {
    max-width: 100%;
  }

  > img {
    max-width: 150px;
  }
}
</style>
