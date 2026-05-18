<script setup lang="ts">
import { type DataType, DataTypeMap } from '@/core/types/data-type'
import { computed } from 'vue'
import { DATA_TYPE_COLORS } from '@/common/config'

interface Props {
  dataType: DataType
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
})
const name = computed(() => DataTypeMap[props.dataType].name)

const emit = defineEmits<{
  toggle: []
}>()

function handleClick() {
  emit('toggle')
}
</script>

<template>
  <div
    class="data-type-card"
    :class="{ selected: selected }"
    @click="handleClick"
    :style="{ '--data-type-color': DATA_TYPE_COLORS[dataType] }"
  >
    {{ name }}
  </div>
</template>

<style scoped lang="scss">
.data-type-card {
  --press-depth: 2px;
  color: var(--data-type-color);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.02em;
  padding: 12px;
  border: 1px solid var(--data-type-color);
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: var(--press-depth);
  transition:
    transform 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
  text-wrap: nowrap;
  box-shadow: var(--press-depth) var(--press-depth) 0 0 color-mix(in srgb, var(--data-type-color), transparent 10%);

  &:hover {
    background-color: color-mix(in srgb, var(--data-type-color), transparent 95%);
  }

  &.selected {
    background-color: color-mix(in srgb, var(--data-type-color), transparent 80%);
    box-shadow: none;
    transform: translate(var(--press-depth), var(--press-depth));

    &:hover {
      background-color: color-mix(in srgb, var(--data-type-color), transparent 70%);
    }
  }
}
</style>
