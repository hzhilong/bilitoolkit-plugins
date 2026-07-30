<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
}>()
</script>

<template>
  <div class="key-value-tag">
    <span class="label">{{ label }}</span>
    <span class="value">{{ value }}</span>
  </div>
</template>

<style scoped lang="scss">
.key-value-tag {
  display: inline-flex;
  align-items: center;
  border-radius: 8px;
  font-size: 10px;
  transition: all 0.2s ease;
  border: 1px solid var(--el-color-primary);
  overflow: hidden;

  .label {
    color: #fff;
    background-color: var(--el-color-primary);
    padding-left: 5px;
    padding-right: 3px;
  }

  .value {
    color: var(--el-color-primary);
    font-weight: 500;
    padding-left: 3px;
    padding-right: 5px;
  }
}
</style>
