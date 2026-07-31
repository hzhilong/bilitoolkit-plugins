<script setup lang="ts">
defineProps<{
  prefix: string
  small?: boolean
}>()
</script>

<template>
  <div
    class="el-input el-input-group el-input-group--append el-input-group--prepend app-query-form-item"
    :class="small ? 'el-input--small' : ''"
  >
    <span class="el-input-group__prepend prefix">{{ prefix }} </span>
    <slot></slot>
  </div>
</template>

<style lang="scss">
.app-query-form-item {
  > :not(.prefix) {
    border-left: 0;
    border-radius: var(--el-input-border-radius);
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    box-shadow: 0 0 0 1px var(--el-border-color) inset;

    .el-select__wrapper {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
  }
}
</style>
