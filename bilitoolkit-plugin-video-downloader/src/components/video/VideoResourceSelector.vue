<script setup lang="ts">
import { formatTime, formatDuration, sleepRandom } from '@ybgnb/utils'
import { Picture } from '@element-plus/icons-vue'
import { type DownloadResourceType, downloadResourceNameMap } from 'bilitoolkit-types'
import {
  formatStatCount,
  parseVideoZoneLabel,
  useSelectData,
  IconLabel,
  AppTooltip,
  VideoStatsInfo,
  DownloadResourceTag,
  useLoadingData,
  useSelectedUserStore,
} from 'bilitoolkit-ui'
import { type VideoInfo } from '@ybgnb/bili-api'
import { storeToRefs } from 'pinia'
import { useAppSettingsStore } from '@/stores/app-settings'
import { cloneDeep } from 'lodash-es'
import type { DownloadVideoData, SelectedPartData } from '@/types/download'
import { watch, onUnmounted, ref, computed, nextTick } from 'vue'
import { createBiliClient } from 'bilitoolkit-runtime/biliapi'
import { buildPartWithPlayData } from '@/utils/download'

const props = defineProps<{
  video: VideoInfo
}>()
const { loading, loadingData } = useLoadingData({ singleFlight: true })
const selectedUserStore = useSelectedUserStore()
const { appSettings } = storeToRefs(useAppSettingsStore())
const allResourceTypes = Object.keys(downloadResourceNameMap) as DownloadResourceType[]
const {
  selectedIds: selectedTypes,
  toggleSelect: handleSelectResource,
  isSelected: isResourceSelected,
} = useSelectData(allResourceTypes, (type: DownloadResourceType) => type, appSettings.value.defaultResourceTypes)

const hasAudio = computed(() => selectedTypes.value.includes('audio'))
const hasVideo = computed(() => selectedTypes.value.includes('video'))

let abortController: AbortController | null = null
const allPartData = ref<SelectedPartData[]>([])
const initPartPlayerInfos = loadingData(async () => {
  allPartData.value.splice(0, allPartData.value.length)
  abortController = new AbortController()
  const signal = abortController.signal
  const client = await createBiliClient(selectedUserStore.user!)
  await client.videoReport.heartbeat(
    {
      w_aid: props.video.aid,
    },
    {
      aid: props.video.aid,
    },
    { signal },
  )
  await sleepRandom(1122, 2233)

  for (let i = 0; i < props.video.pages.length; i++) {
    const part = props.video.pages[i]
    const item = await buildPartWithPlayData(
      {
        appSettings: appSettings.value,
        client: client,
        signal: signal,
      },
      props.video,
      part,
    )
    if (i < props.video.pages.length - 1) {
      await sleepRandom(1122, 2233)
    }
    if (item) {
      allPartData.value.push(item)
    }
  }
  await nextTick()
  if (!isAllPartSelected.value) {
    togglePartAll()
  }
})

const handleVideoQualityChange = (part: SelectedPartData) => {
  if (part.selectedVideoQuality === 127 && part.selectedVideoCodecId === 7) {
    part.selectedVideoCodecId = 12
  }

  const list = part.supportVideoQualitiesMapCodec[part.selectedVideoQuality]
  if (!list.includes(part.selectedVideoCodecId)) {
    part.selectedVideoCodecId = list[0] ?? 0
  }
}

const handleVideoCodecChange = (part: SelectedPartData) => {
  console.log(part)
  if (part.selectedVideoQuality === 127 && part.selectedVideoCodecId === 7) {
    part.selectedVideoQuality = 120
  }

  const list = part.supportVideoCodecMapQuality[part.selectedVideoCodecId]
  if (!list.includes(part.selectedVideoQuality)) {
    part.selectedVideoQuality = list[0] ?? 0
  }
}

watch(() => props.video, initPartPlayerInfos, { immediate: true })

onUnmounted(() => {
  if (abortController) {
    abortController.abort()
  }
})

const {
  selectedIds: selectedParts,
  toggleSelect: handleSelectPart,
  isSelected: isPartSelected,
  isAllSelected: isAllPartSelected,
  toggleAll: togglePartAll,
  getSelectedData: getSelectedPartData,
} = useSelectData(
  () => allPartData.value,
  (part: SelectedPartData) => part.info.cid,
)

const getSelectedData = (): DownloadVideoData => {
  return {
    video: cloneDeep(props.video),
    parts: cloneDeep(getSelectedPartData()),
    resourceTypes: cloneDeep(selectedTypes.value),
  }
}

defineExpose({
  getSelectedData,
})
</script>

<template>
  <div class="download-video-card">
    <div class="info-row">
      <div class="info-left">
        <div class="cover">
          <div class="cover-image">
            <el-image :src="video.pic" fit="cover">
              <template #error>
                <div class="cover-placeholder">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            <div class="download-cover-stats">
              <IconLabel icon="video">{{ formatStatCount(video.stat.view) }}</IconLabel>
              <IconLabel icon="keyboard">{{ formatStatCount(video.stat.danmaku) }}</IconLabel>
              <span></span>
              <span></span>
              <span class="download-cover-stats__duration">{{ formatDuration(video.duration) }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="info-right">
        <div class="info-row">
          <AppTooltip class="title" :content="video.title">{{ video.title }}</AppTooltip>
        </div>
        <div class="info-row">
          <div class="user-info">
            <img class="user-face" :src="video.owner.face" alt="face" />
            <div class="user-name">{{ video.owner.name }}</div>
          </div>
          <div class="zone">{{ parseVideoZoneLabel(video) }}</div>
          <div class="pubdate">{{ formatTime(video.pubdate) }}</div>
        </div>
        <div class="info-row stats">
          <div class="bvid">{{ video.bvid }}</div>
          <VideoStatsInfo :stat="video.stat"></VideoStatsInfo>
        </div>
        <div class="info-row resource-types">
          <div>下载的资源：</div>
          <DownloadResourceTag
            v-for="type in allResourceTypes"
            :key="type"
            :type="type"
            @click="handleSelectResource(type)"
            :class="isResourceSelected(type) ? 'selected' : ''"
          />
        </div>
      </div>
    </div>
    <div class="part-list" v-loading="loading">
      <div class="header">
        <span>已选择 {{ selectedParts.length }} 个视频分 P：</span>
        <div class="actions">
          <el-button size="small" @click="togglePartAll">全选</el-button>
        </div>
      </div>
      <div
        v-for="part in allPartData"
        :key="part.info.cid"
        class="download-video-part-card"
        @click="handleSelectPart(part)"
        :class="isPartSelected(part) ? 'selected' : ''"
      >
        <div class="left-info">
          <div>{{ part.info.page }}P</div>
          <AppTooltip :content="part.info.part">{{ part.info.part }}</AppTooltip>
        </div>
        <div class="right-info">
          <el-select
            v-if="hasAudio"
            v-model.number="part.selectedAudioQuality"
            placeholder="音质"
            size="small"
            style="width: 100px"
            @click.stop
          >
            <el-option v-for="[id, name] in part.supportAudioQualities" :key="id" :label="name" :value="id" />
          </el-select>
          <el-select
            v-if="hasVideo"
            v-model.number="part.selectedVideoQuality"
            placeholder="画质"
            style="width: 80px"
            size="small"
            @change="handleVideoQualityChange(part)"
            @click.stop
          >
            <el-option v-for="[id, name] in part.supportVideoQualities" :key="id" :label="name" :value="id" />
          </el-select>
          <el-select
            v-if="hasVideo"
            v-model.number="part.selectedVideoCodecId"
            placeholder="编码"
            size="small"
            style="width: 70px"
            @change="handleVideoCodecChange(part)"
            @click.stop
          >
            <el-option v-for="[id, name] in part.supportVideoCodecs" :key="id" :label="name" :value="id" />
          </el-select>
          <span>{{ formatDuration(part.info.duration) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.download-video-card {
  color: var(--el-text-color-secondary);
  padding-top: 10px;

  .info-row {
    display: flex;
    gap: 18px;
    align-items: stretch;
  }

  .info-left,
  .info-right {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .info-right {
    flex: 1;
    min-width: 0;
  }

  .cover {
    width: 180px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
    gap: 4px;
    cursor: pointer;
    position: relative;
    border-radius: 6px;
    border: 1px solid var(--el-border-color-lighter);

    .cover-image {
      width: 100%;
      aspect-ratio: 16/9;
      border-radius: 6px;
      overflow: hidden;
      background: var(--el-fill-color-light);
      position: relative;
    }

    .cover-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      color: var(--el-text-color-placeholder);
    }

    .time {
      color: var(--el-text-color-regular);
    }
  }

  .download-cover-stats {
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: 2;
    box-sizing: border-box;
    padding: 16px 8px 6px;
    width: 100%;
    height: 38px;
    border-bottom-right-radius: 6px;
    border-bottom-left-radius: 6px;
    background-image: linear-gradient(180deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.8));
    color: #fff;
    font-size: 12px;
    line-height: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .title {
    font-size: 16px;
    color: var(--el-text-color-primary);
  }

  .user-info {
    display: flex;
    align-items: center;
    color: var(--el-text-color-regular);

    .user-face {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 1px solid var(--el-border-color);
      margin-right: 6px;
      flex-shrink: 0;
    }
  }

  .resource-types {
    gap: 6px;
    user-select: none;

    ::v-deep(.el-tag) {
      cursor: pointer;
      color: var(--el-color-info);
      border-color: var(--el-color-info-light-5);

      &.selected {
        color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9);
        border-color: var(--el-color-primary-light-5);
      }
    }
  }

  .part-list {
    display: flex;
    flex-direction: column;
    padding: 10px 0 10px 10px;
    user-select: none;
    gap: 6px;

    .header {
      color: var(--el-text-color-regular);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  }

  .download-video-part-card {
    background-color: var(--app-bg-color-overlay);
    padding: 2px 10px;
    gap: 10px;
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    justify-content: space-between;
    cursor: pointer;
    border-radius: 3px;
    border: 1px solid var(--app-bg-color-overlay);

    &.selected {
      border-color: var(--el-color-primary-light-5);
    }

    &:hover {
      background-color: var(--app-bg-color-overlay-hover);
    }

    .left-info {
      flex: 1;
      min-width: 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .right-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }
}
</style>
