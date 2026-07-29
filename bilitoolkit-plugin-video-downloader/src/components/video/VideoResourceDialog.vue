<script setup lang="ts">
import { useTemplateRef } from 'vue'
import type { VideoInfo } from '@ybgnb/bili-api'
import VideoResourceSelector from '@/components/video/VideoResourceSelector.vue'
import type { DownloadVideoData } from '@/types/download'
import { showError } from 'bilitoolkit-ui'

defineProps<{
  videos: VideoInfo[]
}>()

const visible = defineModel({ required: true, type: Boolean })
const refSelectors = useTemplateRef<InstanceType<typeof VideoResourceSelector>[]>('refSelectors')

const emits = defineEmits<{
  (e: 'submit', list: DownloadVideoData[]): void
}>()

const handleSubmit = async () => {
  if (refSelectors.value) {
    const list: DownloadVideoData[] = []
    for (const selector of refSelectors.value) {
      const data = selector.getSelectedData()
      if (data.parts.length > 0 && data.resourceTypes.length > 0) {
        list.push(data)
      }
    }
    if (list.length === 0) {
      showError('请选择需要下载的资源')
      return
    }

    emits('submit', list)
    visible.value = false
  }
}
</script>

<template>
  <div class="part-resource-dialog">
    <el-dialog
      title="请选择需要下载的资源"
      v-model="visible"
      width="88%"
      style="max-height: 88vh"
      :close-on-click-modal="true"
      :close-on-press-escape="true"
      :show-close="true"
      align-center
      destroy-on-close
    >
      <div class="dialog-content">
        <div class="video-list-container">
          <div class="header" v-if="videos.length > 1">视频列表：</div>
          <div class="video-list" ref="refVideoList">
            <div class="video-item" v-for="(v, i) in videos" :key="v.aid">
              <div class="header" v-if="videos.length > 1">
                <span>#{{ i + 1 }}</span>
              </div>
              <VideoResourceSelector ref="refSelectors" :video="v" />
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="visible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.part-resource-dialog {
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

  ::v-deep(.el-descriptions__label) {
    text-wrap: nowrap;
  }
  .dialog-content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 20px;

    .video-list-container {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      .header {
        font-size: 14px;
        color: var(--el-text-color-primary);
        margin-bottom: 6px;
      }

      .video-list {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: auto;
        padding-right: 7px;
        gap: 12px;

        .video-item {
          border: 1px solid var(--el-border-color);
          border-radius: 8px;
          padding: 10px 16px;

          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
        }
      }
    }
  }
}
</style>
