<script setup lang="ts">
import WatermarkRemoverView from '@/views/WatermarkRemoverView.vue'
</script>

<template>
  <div class="plugin-page">
    <div class="page-header">批量视频去水印</div>
    <watermark-remover-view class="page-content" />
  </div>
</template>

<style scoped lang="scss">
.plugin-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page);
}
.page-header {
  flex: none;
  padding: 14px 20px;
  border-bottom: 1px solid var(--el-border-color);
  color: var(--el-color-primary);
  background: var(--el-bg-color);
  font-size: 16px;
  font-weight: 600;
}
.page-content {
  flex: 1;
  min-height: 0;
}
</style>
