<script setup lang="ts">
import { PluginPageContent, SettingGroup, SettingItem } from 'bilitoolkit-ui'
import { useAppSettingsStore } from '@/stores/app-settings'
import { storeToRefs } from 'pinia'
const { appSettings } = storeToRefs(useAppSettingsStore())
</script>

<template>
  <plugin-page-content>
    <setting-group name="插件设置">
      <setting-item title="还原最大允许失败次数" desc="0 为不限制">
        <el-input type="number" v-model.number="appSettings.restoreMaxFailures" :min="0" :max="10" />
      </setting-item>
      <setting-item title="创建[收藏夹]达到上限后，将该收藏夹的视频移入默认收藏夹">
        <el-switch />
      </setting-item>
    </setting-group>
  </plugin-page-content>
</template>

<style scoped lang="scss">
.log-print-box {
  flex: 1;
  min-height: 0;
  line-height: 1.4;
}
</style>
