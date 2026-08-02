<script setup lang="ts">
import { PluginPageContent, SettingGroup, SettingItem, showConfirm, showToast } from 'bilitoolkit-ui'
import { useAppSettingsStore } from '@/stores/app-settings'
import { storeToRefs } from 'pinia'
import { onActivated, ref } from 'vue'
import { commentService } from '@/service/comment'
import { sleep } from '@ybgnb/utils'

const { appSettings } = storeToRefs(useAppSettingsStore())

const commentCount = ref('')

const refreshCommentCount = async () => {
  commentCount.value = `${await commentService.getCount()}`
}

onActivated(refreshCommentCount)

const handleClear = async () => {
  await showConfirm('确认清理吗')
  await commentService.deleteAll()
  await sleep(100)
  await refreshCommentCount()
  showToast('已清理评论缓存')
}
</script>

<template>
  <plugin-page-content>
    <setting-group name="插件设置">
      <setting-item
        title="是否启用缓存（可能会漏掉极少数的评论）"
        desc="不建议关闭。缓存可用于后续快速更新评论区，减少重复获取。"
      >
        <el-switch v-model="appSettings.enableCache" />
      </setting-item>
      <setting-item title="从缓存同步评论时，重新获取多少条最外层评论及其楼中楼（按热门排序）" desc="默认 50">
        <el-input type="number" v-model.number="appSettings.cacheSyncRefreshHotCommentLimit" :min="10" :max="200" />
      </setting-item>
      <setting-item title="从缓存同步评论时，重新获取多少条最外层评论及其楼中楼（按时间排序）" desc="默认 100">
        <el-input type="number" v-model.number="appSettings.cacheSyncRefreshTimeCommentLimit" :min="10" :max="300" />
      </setting-item>
      <setting-item title="已缓存的评论数量" :desc="commentCount">
        <el-button type="primary" @click="handleClear">清理</el-button>
      </setting-item>
    </setting-group>
  </plugin-page-content>
</template>

<style scoped lang="scss"></style>
