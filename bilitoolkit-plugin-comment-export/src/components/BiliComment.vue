<script setup lang="ts">
import type { BiliRootComment, BiliCommentEntity } from 'bili-comment-core'
import { IconLabel, formatStatCount, type PageResult } from 'bilitoolkit-ui'
import { getFormattedDateTime } from '@ybgnb/utils'
import { ref, watch } from 'vue'
import { handleOpenComment, handleCopyCommentUrl, handleOpenCommentUser } from '@/utils/click-handlers'

const props = defineProps<{
  comment: BiliRootComment
  subReplies: BiliCommentEntity[]
}>()

const isExpand = ref(false)
const subReplyPageData = ref<PageResult<BiliCommentEntity>>({
  pageNum: 1,
  pageSize: 10,
  totalPages: 1,
  total: 0,
  data: [],
})

const resetSubReplyPageData = () => {
  Object.assign(subReplyPageData.value, {
    pageNum: 1,
    pageSize: 10,
    totalPages: 1,
    total: 0,
    data: [],
  })
}
const refreshSubPageData = () => {
  const { pageNum, pageSize } = subReplyPageData.value
  subReplyPageData.value.data = props.subReplies.slice((pageNum - 1) * pageSize, pageNum * pageSize)
  subReplyPageData.value.total = props.subReplies.length
  subReplyPageData.value.totalPages = Math.ceil(props.subReplies.length / pageSize)
}
const handleExpand = () => {
  isExpand.value = true
  refreshSubPageData()
}
const handleCollapse = () => {
  isExpand.value = false
  resetSubReplyPageData()
}
watch(
  () => props.comment.rpid,
  () => {
    handleCollapse()
  },
  { immediate: true },
)
watch(
  () => subReplyPageData.value.pageNum,
  () => {
    if (isExpand.value) {
      refreshSubPageData()
    }
  },
)
</script>

<template>
  <div class="bili-comment-container">
    <img class="user-avatar" :src="comment.senderFace" alt="" loading="lazy" />
    <div class="main">
      <span class="user-name" @click.stop="handleOpenCommentUser(comment)">{{ comment.senderName }}</span>
      <span class="reply-content">{{ comment.content }}</span>
      <div class="footer">
        <div class="reply-time">{{ getFormattedDateTime(new Date(comment.ctime * 1000)) }}</div>
        <IconLabel icon="thumb-up">{{ formatStatCount(comment.like) }}</IconLabel>
        <el-button link @click.stop="handleOpenComment(comment)">打开</el-button>
        <el-button link @click.stop="handleCopyCommentUrl(comment)">复制评论链接</el-button>
      </div>
    </div>
    <div v-if="subReplies.length > 0" class="expander-container">
      <template v-if="subReplies.length < 5">
        <div class="sub-list">
          <BiliReply v-for="reply in subReplies" :key="reply.rpid" :reply="reply" />
        </div>
      </template>
      <template v-else>
        <template v-if="!isExpand">
          <div class="sub-list">
            <BiliReply v-for="reply in subReplies.slice(0, 2)" :key="reply.rpid" :reply="reply" />
          </div>
          <div class="expander-footer">
            <div class="view-more">
              <span>共{{ subReplies.length }}条回复，</span>
              <el-button link @click="handleExpand">点击查看</el-button>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="sub-list">
            <BiliReply v-for="reply in subReplyPageData.data" :key="reply.rpid" :reply="reply" />
          </div>
          <div class="expander-footer">
            <span>共{{ subReplyPageData.totalPages }}页</span>
            <el-pagination
              layout="pager, next"
              v-model:currentPage="subReplyPageData.pageNum"
              :pageSize="subReplyPageData.pageSize"
              :pageCount="subReplyPageData.totalPages"
              :total="subReplyPageData.total"
              next-text="下一页"
            />
            <el-button link @click="handleCollapse">收起</el-button>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.bili-comment-container {
  width: 100%;
  position: relative;
  padding-left: 80px;
  padding-top: 12px;
  border-radius: 4px;

  .user-avatar {
    position: absolute;
    left: 20px;
    top: 12px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
  }

  .main {
    display: flex;
    flex-direction: column;

    .user-name {
      display: inline-block;
      font-weight: 600;
      color: var(--el-text-color-regular);
      font-size: 14px;
      white-space: nowrap;
      margin-right: 8px;
      cursor: pointer;
    }

    .reply-content {
      display: inline;
      font-size: 16px;
      color: var(--el-text-color-primary);
      word-wrap: break-word;
      overflow-wrap: break-word;
      word-break: break-word;
    }
  }

  .footer {
    display: flex;
    align-items: center;
    gap: 20px;
    color: var(--el-text-color-secondary);
    font-size: 13px;

    ::v-deep(.el-button) {
      font-size: 13px;
      margin-left: 0;
      color: transparent;
    }
  }

  &:hover {
    background-color: var(--app-color-primary-transparent-7);

    .footer::v-deep(.el-button) {
      color: var(--el-text-color-secondary);
    }
  }

  .expander-container {
    margin-top: 2px;

    .expander-footer {
      display: flex;
      align-items: center;
      gap: 20px;
    }
  }
}
</style>
