<script setup lang="ts" generic="O extends OperationType = OperationType">
import { type DataType } from '@/core/types/data-type'
import type { OperationType } from '@/core/types/operation'
import type { ExecuteOptions, User } from '@/core/types/execute'
import { useDataModule } from '@/composables/useDataModule'
import { useExecuteOptions } from '@/composables/useExecuteOptions'

export interface ClearConfigProps {
  user: User
  dataType: DataType
  viewMode?: boolean
}

const props = withDefaults(defineProps<ClearConfigProps>(), {})

const options = defineModel<ExecuteOptions<'clear'>>({ required: true })

const { dataModuleName, dataModuleColor } = useDataModule(() => props.dataType)

useExecuteOptions<'clear'>(() => ({ operationType: 'clear', dataType: props.dataType, user: props.user }), options)
</script>

<template>
  <div class="execute-config" :class="viewMode ? 'readonly' : ''" :style="{ '--data-type-color': dataModuleColor }">
    <div class="header" v-if="!viewMode">
      <span class="data-module-name">{{ dataModuleName }}</span>
    </div>
    <el-form class="form" :model="options" label-width="auto" label-position="left" :disabled="viewMode">
      <el-form-item label="数据范围">
        <el-radio value="all" label="全部数据" v-model="options.dataRange.type" />
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/execute-config';
</style>
