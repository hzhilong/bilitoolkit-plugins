<template>
  <div class="edit-section-modal">
    <el-dialog v-model="visible" title="编辑分组（小节）" width="90vw" style="height: 90vh" align-center>
      <div class="section-container">
        <el-form :model="formData" label-width="120px">
          <el-form-item label="标题" required>
            <el-input v-model="formData.title" placeholder="请输入标题" maxlength="8" show-word-limit />
          </el-form-item>
        </el-form>
      </div>
      <div class="episodes-container" v-loading="loading">
        <EpisodeList v-model="currArchives" @delete="handleDeletedArchives"></EpisodeList>
      </div>

      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="handleAddVideos" v-loading="loading">添加视频</el-button>
        <el-button type="primary" @click="handleSubmit" v-loading="loading">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, ref, computed } from 'vue'
import { showError, useLoadingData, showWarning } from 'bilitoolkit-ui'
import type { MySeasonSection, MyArchive, MySeasonItem } from '@/types'
import EpisodeList from '@/components/EpisodeList.vue'
import { showArchiveSelectDialog } from '@/components/ArchiveSelectDialog/archiveSelectService'
import { chunk } from '@ybgnb/utils'
import type { BiliClient } from '@ybgnb/bili-api'

const props = defineProps<{
  season?: MySeasonItem
  section?: MySeasonSection
  myArchives: MyArchive[]
  client?: BiliClient
}>()
const visible = defineModel<boolean>({ required: true })
const { loading, loadingData } = useLoadingData()
const currArchives = ref<MyArchive[]>([])
const deletedArchives = ref<MyArchive[]>([])
const archiveOptions = computed(() => {
  return props.myArchives.filter((item) => !currArchives.value.some((a) => a.aid === item.aid))
})

const emit = defineEmits<{
  (e: 'edit', title: string, archives: MyArchive[]): void
  (e: 'deleteArchives', deletedItems: MyArchive[]): void
}>()

const formData = reactive<{ title: string }>({
  title: '',
})

watch(
  visible,
  loadingData(async (newVal) => {
    if (newVal) {
      formData.title = props.section?.title ?? ''
      deletedArchives.value = []
      currArchives.value = []
      for (const archive of props.section?.archives ?? []) {
        currArchives.value.push(archive)
      }
    } else {
      formData.title = ''
      currArchives.value = []
      deletedArchives.value = []
    }
  }),
  { immediate: true },
)

const handleDeletedArchives = loadingData(async (list: MyArchive[]) => {
  for (const myArchive of list) {
    deletedArchives.value.push(myArchive)
  }
})

const handleSubmit = loadingData(async () => {
  if (formData.title.trim().length === 0) {
    return showError('请输入标题')
  }
  await props.client!.myArchive.filterTitle(formData.title)
  emit('edit', formData.title, currArchives.value)
  visible.value = false
})

const handleAddVideos = loadingData(async () => {
  const options: MyArchive[] = []
  for (const chunkElement of chunk(archiveOptions.value, 5000)) {
    options.push(...chunkElement)
  }
  for (const chunkElement of chunk(deletedArchives.value, 5000)) {
    options.push(...chunkElement)
  }
  const totalEpCount = props.season!.sections.sections.reduce((acc, curr) => acc + curr.epCount, 0)
  const maxCount = 1000 - (totalEpCount - props.section!.epCount + currArchives.value.length)
  if (maxCount < 1) {
    showWarning('合集视频已达到上限')
    return
  }
  const list = await showArchiveSelectDialog({
    archives: options,
    maxCount: maxCount,
  })
  if (list && list.length > 0) {
    const ids = list.map((a) => a.aid)
    deletedArchives.value = deletedArchives.value.filter((item) => !ids.includes(item.aid))
    for (const myArchive of list) {
      currArchives.value.push(myArchive)
    }
  }
})
</script>

<style lang="scss" scoped>
.edit-section-modal {
  display: contents;

  ::v-deep(> .el-modal-dialog > .el-overlay-dialog > .el-dialog) {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    .el-dialog__body {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
  }

  .episodes-container {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
}
</style>
