<script setup lang="ts" generic="O extends OperationType = OperationType">
import { type DataType } from '@/core/types/data-type'
import type { OperationType } from '@/core/types/operation'
import type { ExecuteOptions, TargetUser } from '@/core/types/execute'
import { registeredModulesMap } from '@/core/modules/register'
import { useTemplateRef } from 'vue'
import { ElForm } from 'element-plus'
import { isBatchable, type BatchableModule } from '@/core/types/batch'
import { DataRangeTypeMap } from '@/core/types/data-range'
import type { BackupOptions } from '@/core/types/backup'
import { useDataModule } from '@/composables/useDataModule'
import { useExecuteOptions } from '@/composables/useExecuteOptions'
import { AppIcon } from 'bilitoolkit-ui'

export interface ExecuteConfigProps<PO extends OperationType = OperationType> {
  user: TargetUser
  operationType: PO
  dataType: DataType
}

const props = withDefaults(defineProps<ExecuteConfigProps<O>>(), {})
const options = defineModel<ExecuteOptions<O>>({ required: true })
const formRef = useTemplateRef<InstanceType<typeof ElForm>>('formRef')
const { dataModuleName, dataModuleColor, dataModuleBackupDesc } = useDataModule(() => props.dataType)
const { onChangeDataRangeType, dataRangeTypes, dataApiPageSize } = useExecuteOptions(() => props, options)

const validate = async () => {
  if (!formRef.value) return true
  return await formRef.value.validate()
}

defineExpose({
  validate,
})
</script>

<template>
  <div class="execute-config" :style="{ '--data-type-color': dataModuleColor }">
    <div class="header">
      <span class="data-module-name">{{ dataModuleName }}</span>
      <span class="data-module-desc" v-if="operationType === 'backup' && dataModuleBackupDesc">{{
        dataModuleBackupDesc
      }}</span>
    </div>
    <el-form class="form" ref="formRef" :model="options" label-width="auto" label-position="left">
      <el-form-item label="备份模式" prop="mode">
        <el-radio-group size="default" v-model="options.mode">
          <el-radio-button value="normal">普通模式</el-radio-button>
          <el-radio-button v-if="isBatchable(registeredModulesMap[dataType])" value="batch"
            >分批处理模式</el-radio-button
          >
        </el-radio-group>
      </el-form-item>
      <template v-if="options.operationType === 'backup'">
        <el-form-item label="导出目录" prop="rootPath">
          <el-text type="info">{{ (options as BackupOptions).rootPath }}</el-text>
        </el-form-item>
        <el-form-item label="导出格式" prop="exportTargets">
          <el-checkbox-group v-model="options.exportTargets">
            <el-checkbox
              v-for="target in registeredModulesMap[dataType].exportTargets"
              :key="target"
              :label="target"
              :value="target"
              :checked="target === 'json'"
              :disabled="target === 'json'"
            />
          </el-checkbox-group>
        </el-form-item>
      </template>
      <template v-if="options.mode === 'normal'">
        <el-form-item label="数据范围" prop="dataRange.type">
          <el-radio-group v-model="options.dataRange.type" @change="onChangeDataRangeType">
            <el-radio v-for="type in dataRangeTypes" :key="type" :value="type" :label="DataRangeTypeMap[type]" />
          </el-radio-group>
        </el-form-item>
        <template v-if="options.dataRange.type === 'page'">
          <el-form-item label="分页大小">
            <el-text type="info">每页 {{ dataApiPageSize }} 条数据</el-text>
          </el-form-item>
          <el-form-item label="分页范围" prop="dataRange.ranges" v-if="options.dataRange.ranges">
            <el-col :span="11"
              ><el-input v-model="options.dataRange.ranges[0]" type="number" placeholder="请输入开始页面"
            /></el-col>
            <el-col style="text-align: center" :span="2">
              <span>-</span>
            </el-col>
            <el-col :span="11"
              ><el-input v-model="options.dataRange.ranges[1]" type="number" placeholder="请输入结束页面"
            /></el-col>
          </el-form-item>
        </template>
        <!--     // TODO 待完善其他数据范围选中组件-->
      </template>
      <template v-if="options.mode === 'batch'">
        <el-form-item label="分批大小" prop="batchOptions.batchSize">
          <template #label>
            <span>分批大小</span>
            <el-tooltip content="每批至少处理该数量的数据" placement="top">
              <AppIcon icon="question" style="margin-left: 4px" />
            </el-tooltip>
          </template>
          <el-radio-group v-model="options.batchOptions.batchSize">
            <el-radio
              v-for="size in (registeredModulesMap[dataType] as BatchableModule).batchSizes"
              :key="size"
              :value="size"
              :label="size"
            />
          </el-radio-group>
        </el-form-item>
      </template>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
.execute-config {
  //  --el-color-primary: var(--data-type-color);
  border-radius: 12px;
  border-left: 4px solid var(--data-type-color);
  overflow: hidden;
  padding: 20px;
  background-color: var(--app-color-background);
  box-shadow: 0 2px 4px 2px var(--app-color-foreground-transparent-10);

  .header {
    margin-bottom: 20px;

    .data-module-name {
      font-size: 16px;
      font-weight: bold;
      color: var(--data-type-color);
    }

    .data-module-desc {
      font-size: 12px;
      margin-left: 12px;
      color: var(--el-text-color-secondary);
    }
  }

  > .form {
  }
}
</style>
