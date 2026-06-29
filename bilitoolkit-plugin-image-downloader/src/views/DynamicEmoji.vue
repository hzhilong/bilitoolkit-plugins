<script setup lang="ts">
import { ref, computed } from 'vue'
import { PluginPageContent, useLoadingData, showWarning, useSelectedUserStore } from 'bilitoolkit-ui'
import { type Dynamic, parseDynamicOid, type RichTextEmojiNode } from '@ybgnb/bili-api'
import { client } from '@/common/client'
import { downloadDynamicEmojis } from '@/utils/download'

const { loading, loadingData } = useLoadingData()
const url = ref('')
const dynamic = ref<Dynamic>()
const emojiList = computed<RichTextEmojiNode[]>(() => {
  if (dynamic.value) {
    const nodes = dynamic.value.modules.module_dynamic.desc?.rich_text_nodes
    if (!nodes) return []
    return nodes.filter((r) => r.type === 'RICH_TEXT_NODE_TYPE_EMOJI')
  } else {
    return []
  }
})
const { assertLoggedIn } = useSelectedUserStore()
const fetchData = loadingData(async () => {
  assertLoggedIn()
  const oid = await parseDynamicOid(url.value)
  dynamic.value = await client.dynamic.getDetail({ id: oid })
  if (!emojiList.value || emojiList.value.length === 0) {
    showWarning('该动态暂无表情')
  }
})
const saveFace = loadingData(async () => {
  await downloadDynamicEmojis(emojiList.value, dynamic.value?.id_str)
})
</script>

<template>
  <PluginPageContent class="page" v-loading="loading">
    <div class="query-section">
      <el-input v-model.trim="url" placeholder="请输入动态链接 / b23分享链接 / 动态oid">
        <template #prepend> 动态链接 </template>
      </el-input>
      <el-button type="primary" @click="fetchData">获取表情包</el-button>
      <el-button v-if="emojiList.length > 0" type="primary" @click="saveFace()">保存表情包</el-button>
    </div>
    <div class="img-container">
      <img v-for="item in emojiList" :src="item.emoji.icon_url" alt="cover" :key="item.emoji.icon_url" loading="lazy" />
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
