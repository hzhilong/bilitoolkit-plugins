<script setup lang="ts">
import { PluginPageContent, SettingGroup, SettingItem } from 'bilitoolkit-ui'
import { useAppSettingsStore } from '@/stores/app-settings'
import { storeToRefs } from 'pinia'
const { appSettings } = storeToRefs(useAppSettingsStore())
</script>

<template>
  <plugin-page-content>
    <setting-group name="插件设置">
      <setting-item
        title="启用防风控策略"
        desc="部分数据在还原时可能触发风控。启用后将尝试降低风控触发概率，但效果未经过充分验证"
      >
        <el-switch v-model="appSettings.avoidRiskControl" />
      </setting-item>
      <setting-item title="还原前是否检查现有数据">
        <el-switch v-model="appSettings.checkExistingData" />
      </setting-item>
      <setting-item title="还原时最大允许失败次数" desc="0 为不限制">
        <el-input type="number" v-model.number="appSettings.restoreMaxFailures" :min="0" :max="10" />
      </setting-item>
      <setting-item title="清空时最大允许失败次数" desc="0 为不限制">
        <el-input type="number" v-model.number="appSettings.clearMaxFailures" :min="0" :max="10" />
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
