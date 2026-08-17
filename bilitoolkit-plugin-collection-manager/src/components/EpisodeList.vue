<script setup lang="ts">
import type { MyArchive } from '@/types'
import { formatTime } from '@ybgnb/utils'
import { AppTooltip } from 'bilitoolkit-ui'
import DraggableList from '@/components/DraggableList/DraggableList.vue'

const videos = defineModel<MyArchive[]>({
  required: true,
})
const emit = defineEmits<{
  (e: 'delete', deletedItems: MyArchive[]): void
}>()
const handleDeleteVideos = async (list: MyArchive[]) => {
  emit('delete', list)
}
</script>

<template>
  <div class="episode-list-container">
    <div class="header">
      <div class="actions"></div>
    </div>
    <DraggableList v-model="videos" item-key="aid" @delete="handleDeleteVideos">
      <template #default="{ row, index }">
        <div class="video-item">
          <span class="index">
            {{ index + 1 }}
          </span>

          <div class="info">
            <div class="bvid">
              {{ row.bvid }}
            </div>

            <AppTooltip class="title" :content="row.title"></AppTooltip>

            <div class="pub-time">
              {{ formatTime(row.pubTime) }}
            </div>
          </div>
        </div>
      </template>
    </DraggableList>
  </div>
</template>

<style scoped lang="scss">
.episode-list-container {
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .description {
      margin-top: 6px;
      color: var(--el-text-color-regular);
      font-size: 13px;
    }

    .actions {
      display: flex;
    }
  }

  .video-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
    background: var(--app-color-background);
  }
}

.video-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0px 10px;
  box-sizing: border-box;
  color: var(--el-text-color-regular);

  .index {
    width: 42px;
    text-align: center;
  }

  .info {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    font-size: 14px;
    gap: 8px;

    .title {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      font-weight: 500;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
