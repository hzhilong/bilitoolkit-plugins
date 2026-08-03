<script setup lang="ts">
import { ref, watch, computed, useTemplateRef } from 'vue'
import {
  PluginPageContent,
  getUserAvatarThumbnail,
  AppTooltip,
  useLoadingTask,
  handleOpenSpace,
  loadingDialog,
  useElementScrollbar,
} from 'bilitoolkit-ui'
import { Search } from '@element-plus/icons-vue'
import { parseDynamicOid, type DynamicReaction } from '@ybgnb/bili-api'
import { publicClient } from 'bilitoolkit-runtime/biliapi'
import { createAbortError } from '@ybgnb/utils'
import { RecycleScroller } from 'vue-virtual-scroller'
import type { ComponentExposed } from 'vue-component-type-helpers'

const url = ref('')

const list = ref<DynamicReaction[]>([])
const filteredKey = ref(0)
const filteredList = ref<DynamicReaction[]>([])
const type = ref<'赞了' | '转发了'>('转发了')

const likeText = computed(() => {
  return `赞了(${list.value.filter((item) => item.action === '赞了').length})`
})
const forwardText = computed(() => {
  return `转发了(${list.value.filter((item) => item.action === '转发了').length})`
})

const refRecycleScroller = useTemplateRef<ComponentExposed<typeof RecycleScroller>>('refRecycleScroller')

const recycleScrollerEl = computed(() => refRecycleScroller.value?.el)

const { hasVerticalScrollbar } = useElementScrollbar(recycleScrollerEl)

const searchTableData = () => {
  filteredKey.value++
  filteredList.value = list.value.filter((item) => item.action === type.value)
}

watch(() => type.value, searchTableData)

const { execTask } = useLoadingTask(async ({ signal }) => {
  const oid = await parseDynamicOid(url.value)

  list.value = await publicClient.dynamicReaction.fetchAll(
    {
      id: oid,
    },
    undefined,
    async (_currList, list) => {
      if (signal.aborted) throw createAbortError()
      loadingDialog.show(`已获取${list.length}条互动数据`)
    },
    { signal },
  )
  searchTableData()
})

const formatAttend = (att: 0 | 1 | 2) => {
  switch (att) {
    case 0:
      return '-'
    case 1:
      return '对方关注了我'
    case 2:
      return '我关注了对方'
  }
}
</script>

<template>
  <PluginPageContent>
    <div class="page-content">
      <div class="actions">
        <el-input v-model.trim="url" placeholder="请输入动态链接 / b23分享链接 / 动态oid" style="max-width: 70%">
          <template #prepend> 链接 </template>
          <template #append>
            <el-button :icon="Search" @click="execTask" />
          </template>
        </el-input>
      </div>

      <div class="table-container" v-if="filteredKey > 0">
        <div class="table-query">
          <el-text size="small">当前互动数据量：{{ list.length }}</el-text>
          <div class="query-item">
            <el-text size="small">互动类型：</el-text>
            <el-radio-group v-model="type" size="small">
              <el-radio :label="likeText" value="赞了" />
              <el-radio :label="forwardText" value="转发了" />
            </el-radio-group>
          </div>
        </div>
        <div class="table-header" :style="{ paddingRight: hasVerticalScrollbar ? '8px' : '0' }">
          <div class="col">序号</div>
          <div class="col">uid</div>
          <div class="col"></div>
          <div class="col uname">用户</div>
          <div class="col">互动类型</div>
          <div class="col">与自己的关系</div>
          <div class="col">操作</div>
        </div>
        <div class="table-body-wrapper">
          <RecycleScroller
            ref="refRecycleScroller"
            v-if="filteredList && filteredList.length > 0"
            class="table-body"
            :key="filteredKey"
            :items="filteredList"
            :item-size="26"
            key-field="mid"
            v-slot="{ item, index }: { item: DynamicReaction; index: number }"
          >
            <div class="table-row">
              <div class="col">{{ index + 1 }}</div>
              <div class="col">{{ item.mid }}</div>
              <img class="col face" :src="getUserAvatarThumbnail(item.face)" alt="face" loading="lazy" />
              <AppTooltip class="col" :content="item.name"></AppTooltip>
              <div class="col">{{ item.action }}</div>
              <div class="col">{{ formatAttend(item.attend) }}</div>
              <el-button link type="primary" @click="handleOpenSpace(item.mid)">打开</el-button>
            </div>
          </RecycleScroller>
          <el-empty v-else description="暂无数据"></el-empty>
        </div>
      </div>
    </div>
  </PluginPageContent>
</template>

<style scoped lang="scss">
.page-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;

  .actions {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .table-container {
    width: 100%;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;

    .table-body-wrapper {
      width: 100%;
      flex: 1;
      min-height: 0;
      .table-body {
        position: relative;
        height: 100%;
        overflow-y: auto;
      }
    }

    ::v-deep(.vue-recycle-scroller__item-view) {
      width: 100%;
    }

    .table-query {
      padding: 10px;
      display: flex;
      align-items: center;
      gap: 52px;

      .query-item {
        display: flex;
        align-items: center;
      }
    }

    .table-header,
    .table-row {
      display: grid;
      grid-template-columns: 44px 160px 50px 2fr 80px 110px 80px;
      align-items: center;
      width: 100%;
      border-bottom: 1px solid var(--el-border-color);
    }

    .table-header {
      font-weight: bold;

      .col.uname {
        text-align: left;
      }
    }

    .col {
      height: 26px;
      line-height: 26px;
      font-size: 14px;
      text-align: center;

      &.face {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        margin: 0 auto;
      }
    }
  }
}
</style>
