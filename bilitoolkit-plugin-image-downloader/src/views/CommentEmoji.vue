<script setup lang="ts">
import { ref, computed } from 'vue'
import { PluginPageContent, useLoadingData, showWarning, useSelectedUserStore } from 'bilitoolkit-ui'
import { type CommentItem, type Emote } from '@ybgnb/bili-api'
import { client } from '@/common/client'
import { downloadCommentEmojis } from '@/utils/download'

const { loading, loadingData } = useLoadingData()
const url = ref('')
const commentItem = ref<CommentItem>()
const emojiList = computed<Emote[]>(() => {
  if (commentItem.value) {
    const emote = commentItem.value.content.emote
    if (emote) {
      return Object.values(emote)
    }
  }
  return []
})
const { assertLoggedIn } = useSelectedUserStore()
const fetchData = loadingData(async () => {
  assertLoggedIn()
  commentItem.value = (await client.comment.resolveCommentItem(url.value)) ?? undefined
  if (!emojiList.value || emojiList.value.length === 0) {
    showWarning('该评论暂无表情')
  }
})
const saveFace = loadingData(async () => {
  await downloadCommentEmojis(emojiList.value, commentItem.value?.oid_str)
})
</script>

<template>
  <PluginPageContent class="page" v-loading="loading">
    <div class="query-section">
      <el-input v-model.trim="url" placeholder="请输入评论链接 / b23分享链接 （视频/动态/专栏底下的评论）">
        <template #prepend> 评论链接 </template>
      </el-input>
      <el-button type="primary" @click="fetchData">获取表情包</el-button>
      <el-button v-if="emojiList.length > 0" type="primary" @click="saveFace()">保存表情包</el-button>
    </div>
    <div class="img-container">
      <img v-for="item in emojiList" :src="item.gif_url ?? item.url" alt="cover" :key="item.url" loading="lazy" />
    </div>
  </PluginPageContent>
</template>

<style scoped lang="scss">
.query-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;

  ::v-deep(.el-button + .el-button) {
    margin-left: 0 !important;
  }
}
.img-container {
  display: flex;
  flex-wrap: wrap;
  overflow-y: auto;
  gap: 10px;

  > img {
    max-width: 100%;
  }
}
</style>
