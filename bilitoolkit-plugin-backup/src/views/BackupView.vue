<script setup lang="ts">
import { LogPrint, PluginPageContent } from 'bilitoolkit-ui'
import { useTemplateRef } from 'vue'
import { useAppSessionStore } from '@/stores/app-session.js'
import { CommonError } from '@ybgnb/utils'

const logBox = useTemplateRef<InstanceType<typeof LogPrint>>('logBox')
const appSessionStore = useAppSessionStore()
const startExec = () => {
  if (appSessionStore.hasActiveTask) {
    throw new CommonError('数据类型为空')
  }
  appSessionStore.setActiveTask(true)
}
</script>

<template>
  <plugin-page-content>
    <div class="options">
      <el-button @click="startExec">开始备份</el-button>
    </div>
    <log-print ref="logBox" class="log-print-box"></log-print>
  </plugin-page-content>
</template>

<style scoped lang="scss">
.log-print-box {
  flex: 1;
  min-height: 0;
  line-height: 1.4;
}
</style>
