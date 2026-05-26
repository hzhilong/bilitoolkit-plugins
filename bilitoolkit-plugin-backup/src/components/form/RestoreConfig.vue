<script setup lang="ts" generic="O extends OperationType = OperationType">
import { type DataType } from '@/core/types/data-type'
import type { OperationType } from '@/core/types/operation'
import type { ExecuteOptions, User } from '@/core/types/execute'
import { useTemplateRef, ref, computed, watch } from 'vue'
import { ElForm } from 'element-plus'
import { DataRangeTypeMap } from '@/core/types/data-range'
import { useDataModule } from '@/composables/useDataModule'
import { useExecuteOptions } from '@/composables/useExecuteOptions'
import { AppIcon } from 'bilitoolkit-ui'
import TreeSelectModal from '@/components/modal/TreeSelectModal.vue'
import { useTreeSelect } from '@/composables/useTreeSelect'
import type { Task } from '@/core/types/task'
import { getDataByBackupTask } from '@/core/utils/data-range'
import type { Data } from '@/core/types/data-module'

export interface RestoreConfigProps {
  user: User
  dataType: DataType
  viewMode?: boolean
  backupTask: Task<'backup'>
}

const props = withDefaults(defineProps<RestoreConfigProps>(), {})

const options = defineModel<ExecuteOptions<'restore'>>({ required: true })

const backedUpData = ref<Data[]>([])

watch(
  () => props.backupTask,
  async () => {
    backedUpData.value = await getDataByBackupTask(props.backupTask, false)
  },
  { immediate: true },
)

const { dataModule, dataModuleName, dataModuleColor, isTreeModule, isBatchModule, batchSizes } = useDataModule(
  () => props.dataType,
)

const dataTotalDesc = computed(() => dataModule.value.getDataTotalDesc(backedUpData.value))

const { dataRangeTypes, pageSize, onChangeDataRangeType } = useExecuteOptions<'restore'>(
  () => ({ operationType: 'restore', dataType: props.dataType, user: props.user }),
  options,
)

const { getTreeNodeDataRangeInfo, treeModalNodes, treeModalVisible, handleOpenTreeModal, handleTreeRangeSubmit } =
  useTreeSelect<'restore'>(options)

const formRef = useTemplateRef<InstanceType<typeof ElForm>>('formRef')

const validate = async () => {
  if (!formRef.value) return true
  return await formRef.value.validate()
}

defineExpose({
  validate,
})
</script>

<template>
  <div class="execute-config" :class="viewMode ? 'readonly' : ''" :style="{ '--data-type-color': dataModuleColor }">
    <div class="header" v-if="!viewMode">
      <span class="data-module-name">{{ dataModuleName }}</span>
    </div>
    <el-form class="form" ref="formRef" :model="options" label-width="auto" label-position="left" :disabled="viewMode">
      <el-form-item v-if="!viewMode" label="任务模式" prop="mode">
        <el-radio-group size="default" v-model="options.mode">
          <el-radio-button value="normal">普通模式</el-radio-button>
          <el-radio-button v-if="isBatchModule" value="batch">分批处理模式</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="备份数据">
        <el-text type="info">{{ dataTotalDesc }}</el-text>
      </el-form-item>
      <template v-if="options.mode === 'normal'">
        <el-form-item label="数据范围" prop="dataRange.type">
          <el-radio-group v-model="options.dataRange.type" @change="onChangeDataRangeType">
            <el-radio v-for="type in dataRangeTypes" :key="type" :value="type" :label="DataRangeTypeMap[type]" />
          </el-radio-group>
        </el-form-item>
        <template v-if="options.dataRange.type === 'page'">
          <el-form-item label="分页大小">
            <el-text type="info">每页 {{ pageSize }} 条数据</el-text>
          </el-form-item>
          <el-form-item label="分页范围" prop="dataRange.ranges" v-if="options.dataRange.ranges">
            <el-col :span="11"
              ><el-input
                v-model.number="options.dataRange.ranges[0]"
                type="number"
                placeholder="请输入开始页面"
                :min="1"
                :max="Math.ceil(backedUpData.length / pageSize)"
            /></el-col>
            <el-col style="text-align: center" :span="2">
              <span>-</span>
            </el-col>
            <el-col :span="11"
              ><el-input
                v-model.number="options.dataRange.ranges[1]"
                type="number"
                placeholder="请输入结束页面"
                :min="1"
                :max="Math.ceil(backedUpData.length / pageSize)"
            /></el-col>
          </el-form-item>
        </template>
        <template v-if="options.dataRange.type === 'tree'">
          <el-form-item label="已选数据">
            <div class="tree-form-item">
              <div class="tree-range-info" v-for="node in options.dataRange.nodes" :key="node._id">
                {{ getTreeNodeDataRangeInfo(node) }}
              </div>
              <el-button
                v-if="!viewMode"
                type="primary"
                size="small"
                @click="handleOpenTreeModal(options.dataRange.nodes)"
                style="width: fit-content"
                >选择</el-button
              >
            </div>
          </el-form-item>
        </template>
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
            <el-radio v-for="size in batchSizes" :key="size" :value="size" :label="size" />
          </el-radio-group>
        </el-form-item>
      </template>
    </el-form>

    <TreeSelectModal
      v-if="isTreeModule && !viewMode"
      :operation-type="'restore'"
      :data-type="dataType"
      :backedUpData="backedUpData"
      :user="user"
      v-model:visible="treeModalVisible"
      v-model:nodes="treeModalNodes"
      @submit="handleTreeRangeSubmit"
    >
    </TreeSelectModal>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/execute-config';
</style>
