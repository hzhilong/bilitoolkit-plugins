<script setup lang="ts">
import { PluginPageContent, SettingGroup, SettingItem } from 'bilitoolkit-ui'
import { useAppSettingsStore } from '@/stores/app-settings'
import { storeToRefs } from 'pinia'
import { watch } from 'vue'

const { appSettings } = storeToRefs(useAppSettingsStore())

watch(
  () => [appSettings.value.businessRequestIntervalMinMs, appSettings.value.businessRequestIntervalMaxMs],
  () => {
    const min = Math.min(appSettings.value.businessRequestIntervalMinMs, appSettings.value.businessRequestIntervalMaxMs)
    const max = Math.max(appSettings.value.businessRequestIntervalMinMs, appSettings.value.businessRequestIntervalMaxMs)
    appSettings.value.businessRequestIntervalMinMs = Math.max(min, 1333)
    appSettings.value.businessRequestIntervalMaxMs = Math.max(max, 1333)
  },
)
</script>

<template>
  <plugin-page-content>
    <setting-group name="插件设置">
      <setting-item
        title="业务请求最小间隔时间（毫秒）"
        desc="业务接口调用后，随机等待时间后再执行下一次请求。最小值 1333 毫秒"
      >
        <el-input type="number" v-model.number="appSettings.businessRequestIntervalMinMs" :min="1333" />
      </setting-item>
      <setting-item title="业务请求最大间隔时间（毫秒）" desc="间隔时间过短可能容易遇到风控">
        <el-input type="number" v-model.number="appSettings.businessRequestIntervalMaxMs" :min="1333" />
      </setting-item>
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
