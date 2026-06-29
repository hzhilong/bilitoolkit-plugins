<script setup lang="ts">
import { ref, computed } from 'vue'
import { PluginPageContent, useLoadingData, showWarning, useSelectedUserStore } from 'bilitoolkit-ui'
import { parseOpusId, type OpusDetail } from '@ybgnb/bili-api'
import { client } from '@/common/client'
import { downloadOpusPics } from '@/utils/download'

const { loading, loadingData } = useLoadingData()
const url = ref('')
const opusDetail = ref<OpusDetail>()
const picList = computed<string[]>(() => {
  if (opusDetail.value) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modules = (opusDetail.value.item.modules ?? []) as any[]
    for (const module of modules) {
      if (module.module_type === 'MODULE_TYPE_CONTENT') {
        const paragraphs = module.module_content?.paragraphs ?? []
        return (
          paragraphs
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((p: any) => p.para_type === 2 && p.pic?.pics != null)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((p: any) => [...p.pic.pics.map((pi: any) => pi.url)])
            .flat()
        )
      }
    }
  }
  return []
})
const { assertLoggedIn } = useSelectedUserStore()
const fetchData = loadingData(async () => {
  assertLoggedIn()
  const id = await parseOpusId(url.value)
  opusDetail.value = await client.opus.getDetail({ id })
  if (!picList.value || picList.value.length === 0) {
    showWarning('该专栏暂无图片内容')
  }
})
const saveFace = loadingData(async () => {
  const title = opusDetail.value!.item.basic.title.split(' - 哔哩哔哩')[0]
  await downloadOpusPics(picList.value, `${title} - ${opusDetail.value?.item.id_str}`)
})
</script>

<template>
  <PluginPageContent class="page" v-loading="loading">
    <div class="query-section">
      <el-input v-model.trim="url" placeholder="请输入专栏链接 / b23分享链接">
        <template #prepend> 专栏链接 </template>
      </el-input>
      <el-button type="primary" @click="fetchData">获取图片</el-button>
      <el-button v-if="picList.length > 0" type="primary" @click="saveFace()">保存图片</el-button>
    </div>
    <div class="img-container">
      <img v-for="item in picList" :src="item" alt="cover" :key="item" />
    </div>
  </PluginPageContent>
</template>

<style scoped lang="scss">
.query-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;

  ::v-deep(.el-button + .el-button) {
    margin-left: 0 !important;
  }
}
.img-container {
  display: flex;
  flex-wrap: wrap;
  overflow-y: auto;
  gap: 10px;

  > img {
    max-width: 100px;
    object-fit: cover;
    height: auto;
  }
}
</style>
