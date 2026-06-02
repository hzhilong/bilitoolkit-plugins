<script setup lang="ts">
import { AppTooltip } from 'bilitoolkit-ui'

defineProps<{
  title: string
  desc: string
}>()
</script>

<template>
  <div class="tool-card">
    <div class="tool-card__title">{{ title }}</div>
    <app-tooltip class="tool-card__desc" :lines="2" :content="desc"></app-tooltip>
  </div>
</template>

<style scoped lang="scss">
.tool-card {
  height: fit-content;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid var(--el-border-color);
  cursor: pointer;

  &:hover {
    box-shadow: var(--el-box-shadow-light);
  }

  &__title {
    color: var(--el-text-color-primary);
    font-size: 18px;
    font-weight: 600;
    line-height: 30px;
  }

  &__desc {
    color: var(--el-text-color-regular);
    font-size: 14px;
    line-height: 1.2em;
    height: calc(1.2em * 2);
  }
}
</style>
