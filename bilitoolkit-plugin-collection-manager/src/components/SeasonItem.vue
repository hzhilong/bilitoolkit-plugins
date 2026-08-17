<script setup lang="ts">
import { AppIcon, IconLabel, AppTooltip, formatStatCount } from 'bilitoolkit-ui'
import { computed } from 'vue'
import type { SeasonStat, SeasonSectionID } from '@ybgnb/bili-api'
import dayjs from 'dayjs'
import type { MySeasonItem } from '@/types'
import { MoreFilled } from '@element-plus/icons-vue'

const props = defineProps<{
  season: MySeasonItem
}>()
const emits = defineEmits<{
  editSeason: []
  deleteSeason: []
  addSection: []
  editSection: [sectionId: SeasonSectionID]
  deleteSection: [sectionId: SeasonSectionID]
}>()
const handleEditSeason = async () => {
  emits('editSeason')
}
const handleDeleteSeason = async () => {
  emits('deleteSeason')
}
const handleAddSection = async () => {
  emits('addSection')
}
const handleEditSection = async (sectionId: SeasonSectionID) => {
  emits('editSection', sectionId)
}
const handleDeleteSection = async (sectionId: SeasonSectionID) => {
  emits('deleteSection', sectionId)
}
const noSection = computed(() => props.season.season.no_section === 1)
const stateList = computed(() => {
  const list: string[] = []
  if (props.season.checkin?.status !== 0) {
    list.push(`审核未通过：${props.season.checkin.status_reason}`)
  } else {
    list.push('正常显示')
  }
  if (!noSection.value) {
    list.push('使用分组（小节）中')
  }
  return list
})
const cTime = computed(() => dayjs.unix(props.season.season.ctime).format('YYYY年MM月DD日 HH:mm:ss'))
const stats = computed<Array<[string, keyof SeasonStat]>>(() => {
  return [
    ['video', 'view'],
    ['keyboard', 'danmaku'],
    ['discuss', 'reply'],
    ['money-cny-circle', 'coin'],
    ['star', 'fav'],
    ['thumb-up', 'like'],
    ['share-forward', 'share'],
    ['bookmark-3', 'subscription'],
  ]
})
</script>

<template>
  <div class="season-list-item">
    <div class="header">
      <div class="title">{{ season.season.title }}</div>
      <div class="actions">
        <el-button link type="primary" @click.stop="handleEditSeason">编辑</el-button>
        <el-button link type="info" @click.stop="handleDeleteSeason">删除</el-button>
      </div>
    </div>
    <div class="state-list">
      <div class="time">{{ cTime }}</div>
      <div class="state-item" v-for="item in stateList" :key="item">{{ item }}</div>
    </div>
    <div class="stat-list">
      <div class="stat-item" v-for="[icon, field] in stats" :key="field">
        <AppIcon :icon="icon"></AppIcon>
        <span class="value">{{ formatStatCount(season.seasonStat[field as keyof SeasonStat]) }}</span>
      </div>
    </div>
    <div class="section-list">
      <template v-if="noSection">
        <div class="section-item is-episode" @click.stop="handleEditSection(season.sections.sections[0].id)">
          <div class="cover-container">
            <div class="cover-stats">
              <IconLabel icon="folder-open">共{{ season.sections.sections[0].archives.length }}集</IconLabel>
            </div>
          </div>
          <div class="title-container">
            <AppTooltip class="title" :content="season.sections.sections[0].title"></AppTooltip>
            <el-dropdown trigger="click">
              <el-icon @click.stop :size="14" style="transform: rotate(90deg)"><MoreFilled /></el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click.stop="handleEditSection(season.sections.sections[0].id)"
                    >编辑</el-dropdown-item
                  >
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </template>
      <template v-else>
        <div v-if="season.sections.sections.length < 10" class="add-action" @click.stop="handleAddSection">
          新建分组 (小节)
        </div>
        <div
          class="section-item"
          v-for="item in season.sections.sections"
          :key="item.id"
          @click.stop="handleEditSection(item.id)"
        >
          <div class="cover-container">
            <el-image :src="item.cover" fit="cover"> </el-image>
            <div class="cover-stats">
              <IconLabel icon="folder-open">共{{ item.epCount }}集</IconLabel>
            </div>
          </div>
          <div class="title-container">
            <AppTooltip class="title" :content="item.title"></AppTooltip>
            <el-dropdown trigger="click">
              <el-icon @click.stop :size="14" style="transform: rotate(90deg)"><MoreFilled /></el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click.stop="handleEditSection(item.id)">编辑</el-dropdown-item>
                  <el-dropdown-item @click.stop="handleDeleteSection(item.id)">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.season-list-item {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 20px 24px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;

  .header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .title {
      font-size: 16px;
      color: var(--el-text-color-primary);
      font-weight: 600;
    }

    .actions {
      display: flex;
      align-items: center;
    }
  }

  .state-list {
    display: flex;
    align-items: center;
    gap: 14px;
    color: var(--el-text-color-regular);

    .time {
      font-size: 14px;
    }

    .state-item {
      box-sizing: border-box;
      -webkit-user-select: none;
      user-select: none;
      border: 1px solid var(--el-border-color);
      border-radius: 12px;
      height: 24px;
      padding: 0 12px;
      font-size: 12px;
      line-height: 22px;
      display: inline-block;
    }
  }

  .stat-list {
    display: flex;
    align-items: center;
    gap: 14px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
    user-select: none;

    .stat-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }

  .section-list {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 20px;

    .add-action {
      text-align: center;
      color: var(--el-color-primary);
      cursor: pointer;
      -webkit-user-select: none;
      user-select: none;
      border: 1px dashed var(--el-color-primary);
      border-radius: 4px;
      width: 149px;
      height: 93px;
      font-size: 13px;
      line-height: 91px;
      position: relative;

      &:hover {
        background-color: var(--app-color-primary-transparent-10);
      }
    }

    .section-item {
      width: 150px;
      user-select: none;
      cursor: pointer;

      .cover-container {
        width: 100%;
        aspect-ratio: 16/9;
        border-radius: 6px;
        overflow: hidden;
        background: var(--el-fill-color-light);
        position: relative;

        .cover-stats {
          position: absolute;
          color: #fff;
          background-image: linear-gradient(-180deg, #0000 0%, #0006 100%);
          border-radius: 0 0 4px 4px;
          height: 32px;
          font-size: 12px;
          padding: 11px 6px 0;
          display: inline-block;
          bottom: 0;
          left: 0;
          right: 0;
          overflow: hidden;
        }
      }

      .title-container {
        width: 100%;
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        justify-content: space-between;
        color: var(--el-text-color-regular);

        .title {
          flex: 1;
          min-width: 0;
          text-wrap: nowrap;
        }
      }

      &.more-data {
        text-align: center;
        color: var(--el-border-color-darker);
        -webkit-user-select: none;
        user-select: none;
        border: 1px dashed var(--el-border-color-darker);
        border-radius: 4px;
        width: 149px;
        height: 93px;
        font-size: 13px;
        line-height: 91px;
        position: relative;
      }
    }
  }
}
</style>
