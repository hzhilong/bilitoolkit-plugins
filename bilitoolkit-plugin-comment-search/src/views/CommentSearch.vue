<script setup lang="ts">
import { ref } from 'vue'
import { PluginPageContent, useSelectedUserStore, AppTooltip, loadingDialog, showToast } from 'bilitoolkit-ui'
import { RecycleScroller } from 'vue-virtual-scroller'
import { type CommentItem, getCommentUrl } from '@ybgnb/bili-api'
import { formatTime } from '@ybgnb/utils'
import { ArrowUp } from '@element-plus/icons-vue'
import { parseUrl } from '@/utils/parse-url'
import { fetchComments } from '@/utils/fetch-comments'
import type { CommentQuery } from '@/types'

const { assertLoggedIn } = useSelectedUserStore()
const url = ref('')
const queryParams = ref<CommentQuery>({
  isFetchSub: false,
  mode: '2',
})
const isCollapseQuery = ref(false)
const searched = ref<boolean>(false)
const commentList = ref<CommentItem[]>([])

function formatPositiveInteger(value: string): number | undefined {
  const digits = value.replace(/\D/g, '')
  const trimmed = digits.replace(/^0+/, '')
  if (trimmed === '') return undefined
  return Number(trimmed)
}

const handleSearch = async () => {
  const abortController = new AbortController()
  assertLoggedIn()
  loadingDialog.show({
    message: '获取评论中...',
    showCancel: true,
    onCancel: () => abortController.abort(),
  })
  try {
    searched.value = false
    const commentSource = await parseUrl(url.value)
    if (abortController.signal.aborted) return

    commentList.value.splice(
      0,
      commentList.value.length,
      ...(await fetchComments(commentSource, queryParams.value, {
        signal: abortController.signal,
      })),
    )
    searched.value = true
  } finally {
    loadingDialog.close()
  }
}

const handleOpen = (item: CommentItem) => {
  assertLoggedIn()
  window.open(getCommentUrl(item))
}
const handleCopy = async (item: CommentItem) => {
  assertLoggedIn()
  await navigator.clipboard.writeText(getCommentUrl(item))
  showToast('已复制该评论的分享链接')
}
</script>

<template>
  <PluginPageContent>
    <div class="page-content">
      <div class="query-section" :class="isCollapseQuery ? 'collapse' : ''">
        <div class="query-form-wrapper">
          <div class="query-form">
            <div></div>
            <el-input v-model.trim="url" placeholder="请输入视频链接 / BV号 / av号 / 动态链接 / 专栏链接">
              <template #prepend> 链接 </template>
            </el-input>
            <div class="row-items">
              <el-input
                :model-value="queryParams.uid"
                @update:model-value="queryParams.uid = formatPositiveInteger($event)"
                placeholder=""
                inputmode="numeric"
                clearable
                @clear="queryParams.uid = undefined"
              >
                <template #prepend>用户 UID</template>
              </el-input>
              <el-input
                v-model.trim="queryParams.keyword"
                placeholder=""
                clearable
                @clear="queryParams.keyword = undefined"
              >
                <template #prepend>关键词</template>
              </el-input>
            </div>
            <div class="row-items">
              <el-input
                :model-value="queryParams.maxCount"
                @update:model-value="queryParams.maxCount = formatPositiveInteger($event)"
                inputmode="numeric"
                placeholder=""
                clearable
                @clear="queryParams.maxCount = undefined"
                style="width: 200px"
              >
                <template #prepend>最大搜索条数</template>
              </el-input>
              <el-radio-group v-model="queryParams.mode">
                <el-radio-button label="按热度" value="3"></el-radio-button>>
                <el-radio-button label="按时间" value="2"></el-radio-button>>
              </el-radio-group>
              <el-checkbox v-model="queryParams.isFetchSub" label="包含子评论"></el-checkbox>
            </div>
            <el-button type="primary" @click="handleSearch">查询评论</el-button>
          </div>
        </div>
        <div class="collapse-arrow" v-if="searched" @click="isCollapseQuery = !isCollapseQuery">
          <el-icon><ArrowUp /></el-icon>
        </div>
      </div>
      <div v-if="commentList && commentList.length > 0" class="table-wrapper">
        <div class="table-query">
          <div class="total-label">{{ `当前评论数量 ：${commentList.length}` }}</div>
        </div>
        <div class="table-header">
          <div class="col index">序号</div>
          <div class="col progress">发布时间</div>
          <div class="col content">评论内容</div>
          <div class="col users">发送者</div>
          <div class="col options">操作</div>
        </div>
        <div class="table-body-wrapper" v-if="searched">
          <RecycleScroller
            class="table-body"
            :items="commentList"
            :item-size="26"
            key-field="rpid_str"
            v-slot="{ item, index }: { item: CommentItem; index: number }"
          >
            <div class="table-row">
              <div class="col index">{{ index + 1 }}</div>
              <div class="col progress">{{ formatTime(item.ctime) }}</div>
              <div class="col content">
                <AppTooltip :content="item.content.message"></AppTooltip>
              </div>
              <div class="col users">
                <el-tooltip
                  :content="item.member.uname + '<br/>' + item.member.mid"
                  placement="top"
                  effect="light"
                  raw-content
                >
                  {{ item.member.uname }}
                </el-tooltip>
              </div>
              <div class="col options">
                <el-button type="primary" link @click="handleOpen(item)">查看</el-button>
                <el-button type="primary" link @click="handleCopy(item)">获取分享链接</el-button>
              </div>
            </div>
          </RecycleScroller>
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
  padding: 0 20px;

  .query-section {
    width: 560px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0 auto;

    .query-form-wrapper {
      display: grid;
      grid-template-rows: 1fr;
      transition: grid-template-rows 0.35s ease;

      .query-form {
        display: flex;
        min-height: 0;
        flex-direction: column;
        gap: 10px;
        overflow: hidden;
        > div {
          width: 100%;
        }

        .row-items {
          display: flex;
          align-items: center;
          gap: 20px;
        }
      }
    }

    .collapse-arrow {
      width: fit-content;
      display: inline-flex;
      align-items: center;
      margin: 0 auto;
      padding: 2px 4px;
      cursor: pointer;

      ::v-deep(.el-icon) {
        transition: transform 0.3s ease;
      }

      &:hover {
        background-color: var(--app-color-primary-transparent-10);
      }
    }

    &.collapse {
      .query-form-wrapper {
        grid-template-rows: 0fr;
      }

      ::v-deep(.el-icon) {
        transform: rotate(-180deg);
        transform-origin: center;
      }
    }
  }

  .table-wrapper {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border-top: 1px solid var(--el-border-color);
    padding-top: 10px;

    .hint {
      margin-bottom: 8px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    ::v-deep(.vue-recycle-scroller__item-view) {
      width: 100%;
    }

    .table-header,
    .table-row {
      display: grid;
      grid-template-columns: 44px 160px minmax(0, 1fr) 160px 160px;
      gap: 16px;
      align-items: center;
      width: 100%;
      border-bottom: 1px solid var(--el-border-color);
    }

    .col {
      height: 26px;
      text-align: center;
      min-width: 0;
      overflow: hidden;
      display: flex;
      justify-content: center;
    }

    .table-header {
      font-weight: bold;
      padding-right: 8px;
    }

    .table-body-wrapper {
      flex: 1;
      min-height: 0;
      .table-body {
        position: relative;
        height: 100%;
        overflow-y: auto;
      }
    }

    .col.users {
      text-align: center;
    }

    .col.options {
      ::v-deep(.el-button + .el-button) {
        margin-left: 0 !important;
      }

      ::v-deep(.el-button) {
        height: 26px !important;
        line-height: 26px !important;
        user-select: text;
      }
    }

    .table-query {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 20px;
      margin-bottom: 20px;
      ::v-deep(.el-input-group) {
        width: 260px;
      }

      .total-label {
        margin-right: auto;
      }
    }
  }
}
</style>
