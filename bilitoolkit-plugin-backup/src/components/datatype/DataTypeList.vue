<script setup lang="ts">
import type { DataType } from '@/core/types/data-type'

const props = defineProps<{
  modelValue: DataType[]
  options: DataType[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: DataType[]]
}>()

function toggle(dataType: DataType) {
  const list = [...props.modelValue]
  const index = list.indexOf(dataType)

  if (index > -1) {
    list.splice(index, 1)
  } else {
    list.push(dataType)
  }

  emit('update:modelValue', list)
}
</script>

<template>
  <div class="data-type-list">
    <DataTypeCard
      v-for="item in options"
      :key="item"
      :data-type="item"
      :selected="modelValue.includes(item)"
      @toggle="toggle(item)"
    >
    </DataTypeCard>
  </div>
</template>

<style scoped lang="scss">
.data-type-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}
</style>
