<script setup lang="ts">
import { PluginPageContent, SettingGroup, SettingItem } from 'bilitoolkit-ui'
import { useAppSettingsStore } from '@/stores/app-settings'
import { storeToRefs } from 'pinia'
import { watch } from 'vue'

const { appSettings } = storeToRefs(useAppSettingsStore())

watch(
  [() => appSettings.value.businessRequestIntervalMinMs, () => appSettings.value.businessRequestIntervalMaxMs],
  ([min, max]) => {
    const newMin = Math.max(Math.min(min, max), 1333)
    const newMax = Math.max(Math.max(min, max), 1333)
    if (appSettings.value.businessRequestIntervalMinMs !== newMin) {
      appSettings.value.businessRequestIntervalMinMs = newMin
    }
    if (appSettings.value.businessRequestIntervalMaxMs !== newMax) {
      appSettings.value.businessRequestIntervalMaxMs = newMax
    }
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
