<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAppSettingsStore } from '@/stores/app-settings'
import { PluginPageContent, SettingItem, SettingGroup, showToast } from 'bilitoolkit-ui'
import { myArchivesRepo } from '@/db/repo/my-archives'

const { appSettings } = storeToRefs(useAppSettingsStore())
const handleClearCache = async () => {
  await myArchivesRepo.deleteAll()
  showToast('已清理所有缓存')
}
</script>

<template>
  <plugin-page-content>
    <setting-group name="缓存设置">
      <setting-item title="是否缓存稿件信息" desc="建议开启，避免每次管理合集都需要重新获取所有的稿件信息">
        <el-switch v-model="appSettings.cacheMyArchives" />
      </setting-item>
      <setting-item title="稿件信息缓存" v-if="appSettings.cacheMyArchives">
        <el-button @click="handleClearCache">清理所有缓存</el-button>
      </setting-item>
    </setting-group>
  </plugin-page-content>
</template>

<style scoped lang="scss"></style>
