<script setup lang="ts">
import { useTemplateRef, ref, nextTick, computed } from 'vue'
import BiliCommentsSection from '@/components/BiliCommentsSection.vue'
import type { BiliCommentCollection, BiliRootComment, BiliCommentRootId, BiliCommentEntity } from 'bili-comment-core'
import { importContentWithComment } from '@/utils/file'
import { showError, KeyValueTag, useLoadingData } from 'bilitoolkit-ui'
import { getErrorMessage } from '@ybgnb/utils'
import type { ContentWithComment } from '@/types'
import { parseContentTags } from '@/utils/content-tags'

const { loading, loadingData } = useLoadingData()
const fileInputRef = useTemplateRef<HTMLInputElement>('fileInputRef')
const refCommentSection = useTemplateRef<HTMLDivElement>('refCommentSection')

const triggerUpload = () => fileInputRef.value?.click()

const queryParams = ref<{
  keyword?: string
  uid?: number
}>({})
const resetQueryParams = () => {
  queryParams.value.keyword = undefined
  queryParams.value.uid = undefined
}

const contentTags = ref<[string, string][]>([])

const commentCollection = ref<BiliCommentCollection>()
const filteredCommentsSectionKey = ref(0)
const filteredCommentCollection = ref<BiliCommentCollection>()
const setFilteredCommentCollection = (data: BiliCommentCollection) => {
  filteredCommentsSectionKey.value++
  filteredCommentCollection.value = data
}

const currTotalCount = computed(() => {
  if (!filteredCommentCollection.value) return 0
  return (
    filteredCommentCollection.value.comments.length +
    filteredCommentCollection.value.comments.reduce(
      (acc, cur) => acc + (filteredCommentCollection.value?.replies[cur.rpid] ?? []).length,
      0,
    )
  )
})

const search = loadingData(async () => {
  const { keyword, uid } = queryParams.value
  const filter = (item: BiliCommentEntity): boolean => {
    if (keyword && !item.content.includes(keyword)) return false
    if (uid != null && item.senderUid !== uid) return false
    return true
  }

  const filteredComments: BiliRootComment[] = []
  const filteredReplies: Record<BiliCommentRootId, BiliCommentEntity[]> = {}
  const { comments, replies } = commentCollection.value!

  for (const [root, reply] of Object.entries(replies)) {
    const filteredList = reply.filter(filter)
    if (filteredList.length > 0) {
      filteredReplies[root] = filteredList
    }
  }

  for (const comment of comments) {
    if (filter(comment) || filteredReplies[comment.rpid] != null) {
      filteredComments.push(comment)
    }
  }
  setFilteredCommentCollection({
    comments: filteredComments,
    replies: filteredReplies,
  })
})

const handleImportedData = async (data: ContentWithComment) => {
  resetQueryParams()
  filteredCommentCollection.value = undefined
  commentCollection.value = data
  contentTags.value = parseContentTags(data)
  await search()
}

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = loadingData(async (e) => {
    try {
      await handleImportedData(await importContentWithComment(e.target?.result as string))
    } catch (e) {
      showError(`导出json文件出错：${getErrorMessage(e)}`)
    }
  })
  reader.readAsText(file)
  input.value = ''
}
const handleAfterRefresh = () => {
  nextTick(() => {
    refCommentSection.value?.scrollTo(0, 0)
  })
}
</script>

<template>
  <div class="comment-import-view" v-loading="loading">
    <input
      ref="fileInputRef"
      type="file"
      accept=".json,application/json"
      style="display: none"
      @change="handleFileChange"
    />
    <div class="header-actions">
      <el-button @click="triggerUpload" type="primary" size="small">加载评论 json 文件</el-button>
    </div>
    <div class="content-tags" v-if="commentCollection">
      <span>当前文件：</span>
      <KeyValueTag v-for="[key, value] in contentTags" :key="key" :label="key" :value="value"></KeyValueTag>
    </div>
    <div class="query-section" v-if="commentCollection">
      <span class="curr-count">当前评论总数：{{ currTotalCount }}</span>
      <el-input v-model.trim="queryParams.keyword" placeholder="" clearable size="small">
        <template #prepend>关键词</template>
      </el-input>
      <el-input v-model.number="queryParams.uid" type="number" placeholder="" clearable size="small">
        <template #prepend>用户uid</template>
      </el-input>
      <el-button type="primary" @click="resetQueryParams" size="small">重置</el-button>
      <el-button type="primary" @click="search" size="small">查询</el-button>
    </div>
    <div class="comments-section-wrapper" v-if="filteredCommentCollection">
      <BiliCommentsSection
        v-bind="filteredCommentCollection"
        :key="filteredCommentsSectionKey"
        @afterRefresh="handleAfterRefresh"
      ></BiliCommentsSection>
    </div>
  </div>
</template>

<style scoped lang="scss">
.comment-import-view {
  display: flex;
  flex-direction: column;
  padding: 6px;
  gap: 10px;

  .header-actions {
  }

  .query-section {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    ::v-deep(.el-input-group) {
      width: 190px;
      .el-input-group__prepend {
        padding: 0 10px;
      }
    }

    .curr-count {
      margin-right: auto;
    }
  }

  .content-tags {
    padding-top: 10px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-top: 1px solid var(--el-border-color);
  }

  .comments-section-wrapper {
    flex: 1;
    min-height: 0;
    padding-top: 10px;
    border-top: 1px solid var(--el-border-color);
    display: flex;
    flex-direction: column;
  }
}
</style>
