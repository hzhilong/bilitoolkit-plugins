<script setup lang="ts">
import { ref } from 'vue'
import type { CheckboxValueType } from 'element-plus'
import type { OperationType } from '@/core/types/operation'
import type { DataType } from '@/core/types/data-type'

const props = defineProps<{
  operationType: OperationType
  dataTypes: DataType[]
}>()

const checkAll = ref(false)
const isIndeterminate = ref(false)
const checkedDataTypes = ref<DataType[]>([])

const handleCheckAllChange = (val: CheckboxValueType) => {
  checkedDataTypes.value = val ? props.dataTypes : []
  isIndeterminate.value = false
}
const handleCheckedCitiesChange = (value: CheckboxValueType[]) => {
  const checkedCount = value.length
  checkAll.value = checkedCount === props.dataTypes.length
  isIndeterminate.value = checkedCount > 0 && checkedCount < props.dataTypes.length
}
const getChecked = () => {
  return checkedDataTypes.value
}
defineExpose({
  getChecked,
})
</script>

<template>
  <div class="datatype-select">
    <div class="datatype-select__header">
      请选择要{{ operationType }}的数据：
      <el-checkbox size="default" v-model="checkAll" :indeterminate="isIndeterminate" @change="handleCheckAllChange">
      </el-checkbox>
    </div>

    <el-checkbox-group v-model="checkedDataTypes" @change="handleCheckedCitiesChange">
      <el-checkbox size="default" v-for="dataType in dataTypes" :key="dataType" :label="dataType" :value="dataType">
        {{ dataType }}
      </el-checkbox>
    </el-checkbox-group>
  </div>
</template>

<style lang="scss">
.datatype-select {
  &__header {
    display: flex;
    align-items: center;
  }
}
</style>
