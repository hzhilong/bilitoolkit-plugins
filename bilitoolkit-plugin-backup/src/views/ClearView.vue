<script setup lang="ts">
import { LogPrint, PluginPageContent } from 'bilitoolkit-ui'
import { useTemplateRef } from 'vue'

const logBox = useTemplateRef<InstanceType<typeof LogPrint>>('logBox')
</script>

<template>
  <plugin-page-content>
    <div class="options">
      <el-button @click="logBox?.addLog('测试')">开始备份</el-button>
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
