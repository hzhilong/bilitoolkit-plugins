<script setup lang="ts">
import { PluginPageContent, SettingGroup, SettingItem, showToast } from 'bilitoolkit-ui'
import { useAppSettingsStore } from '@/stores/app-settings'
import { storeToRefs } from 'pinia'
import { robotScoreRules, type RobotScoreRule, type RobotScoreRuleKey } from '@/types'
import { defaultAppSettings } from '@/config/default'

const appSettingsStore = useAppSettingsStore()
const { reset } = appSettingsStore
const { appSettings } = storeToRefs(appSettingsStore)
const defaultSettings = defaultAppSettings()

const handleResetDefault = async () => {
  await reset()
  showToast('已恢复默认设置')
}
</script>

<template>
  <plugin-page-content>
    <setting-group name="插件设置">
      <setting-item title="跳过 lv3 及以上" desc="机器人基本是 lv2">
        <el-switch v-model="appSettings.skipLvGt2" />
      </setting-item>
      <setting-item title="机器人评分临界值" desc="超过该值的都会被认定为机器人">
        <el-input type="number" v-model.number="appSettings.robotScoreThreshold" style="width: 80px" :min="5" />
      </setting-item>
      <setting-item title="恢复默认设置" desc="将所有配置项重置为插件初始状态">
        <el-button @click="handleResetDefault">立即重置</el-button>
      </setting-item>
    </setting-group>
    <setting-group name="机器人评分规则">
      <setting-item
        v-for="rule in robotScoreRules as RobotScoreRule[]"
        :title="rule.name"
        :desc="`${rule.desc ?? ''}默认值：${defaultSettings.robotScoreRules[rule.key as RobotScoreRuleKey]}`"
        :key="rule.key"
      >
        <el-input
          type="number"
          v-model.number="appSettings.robotScoreRules[rule.key as RobotScoreRuleKey]"
          style="width: 80px"
        />
      </setting-item>
    </setting-group>
  </plugin-page-content>
</template>

<style scoped lang="scss"></style>
