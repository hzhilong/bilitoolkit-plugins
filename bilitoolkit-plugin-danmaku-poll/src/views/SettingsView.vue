<script setup lang="ts">
import { PluginPageContent, SettingGroup, SettingItem } from 'bilitoolkit-ui'
import { useAppSettingsStore } from '@/stores/app-settings'
import { storeToRefs } from 'pinia'

const { appSettings } = storeToRefs(useAppSettingsStore())
</script>

<template>
  <plugin-page-content>
    <setting-group name="插件设置">
      <setting-item title="开启后，投票启动时会自动在弹幕区发送多条提示消息，告知观众当前投票选项及参与方式">
        <el-switch v-model="appSettings.autoSendStartDanmaku" />
      </setting-item>
    </setting-group>
  </plugin-page-content>
</template>

<style scoped lang="scss"></style>
