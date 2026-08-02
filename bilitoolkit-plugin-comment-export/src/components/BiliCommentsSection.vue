<script setup lang="ts">
import { type BiliRootComment, type BiliCommentCollection } from 'bili-comment-core'
import { ref, watch, useTemplateRef, nextTick, computed } from 'vue'
import { type PageResult } from 'bilitoolkit-ui'

const props = defineProps<BiliCommentCollection>()
const refCommentScroller = useTemplateRef<HTMLDivElement>('refCommentScroller')

const pageData = ref<PageResult<BiliRootComment>>({
  pageNum: 1,
  pageSize: 20,
  totalPages: 1,
  total: 0,
  data: [],
})

const resetPageData = () => {
  Object.assign(pageData.value, {
    pageNum: 1,
    pageSize: 20,
    totalPages: 1,
    total: 0,
    data: [],
  })
}

const refreshPageData = () => {
  const { pageNum, pageSize } = pageData.value
  pageData.value.data = props.comments.slice((pageNum - 1) * pageSize, pageNum * pageSize)
  pageData.value.total = props.comments.length
  pageData.value.totalPages = Math.ceil(props.comments.length / pageSize)
  nextTick(() => {
    refCommentScroller.value?.scrollTo(0, 0)
  })
}

watch(
  () => props.comments,
  () => {
    resetPageData()
  },
)

watch(
  () => pageData.value.pageNum,
  () => {
    refreshPageData()
  },
  { immediate: true },
)

const currPageTotalCommentCount = computed(() => {
  return (
    pageData.value.data.length +
    pageData.value.data.reduce((acc, cur) => acc + (props.replies[cur.rpid] ?? []).length, 0)
  )
})
</script>

<template>
  <div class="bili-comments-section">
    <div class="comment-scroller" ref="refCommentScroller">
      <div class="comment-list">
        <BiliComment
          v-for="comment in pageData.data"
          :key="comment.rpid"
          :comment="comment"
          :subReplies="replies[comment.rpid] ?? []"
        />
        <span v-if="comments.length <= pageData.pageSize" style="margin: 0 auto">没有更多评论</span>
      </div>
    </div>
    <div class="footer">
      <template v-if="comments.length > pageData.pageSize">
        <span class="curr-count">当前{{ currPageTotalCommentCount }}条</span>
        <el-pagination
          layout="pager, next"
          v-model:currentPage="pageData.pageNum"
          :pageSize="pageData.pageSize"
          :pageCount="pageData.totalPages"
          :total="pageData.total"
          next-text="下一页"
        />
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.bili-comments-section {
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;

  .comment-scroller {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding-right: 10px;

    .comment-list {
      display: flex;
      flex-direction: column;
    }
  }

  .footer {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  ::v-deep(.el-pager li),
  ::v-deep(.el-pagination .btn-next) {
    background-color: unset;
  }
}
</style>
