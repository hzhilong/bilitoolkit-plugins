<script setup lang="ts">
import { PluginPageContent, useSelectData, showToast, showWarning, showConfirmSequence } from 'bilitoolkit-ui'
import { ref } from 'vue'
import { type DataType, DataTypeMap } from '@/core/types/data-type'
import { allClearableModules } from '@/core/modules/register'
import { storeToRefs } from 'pinia'
import { useAppSessionStore } from '@/stores/app-session'
import { useUser } from '@/composables/useUser'
import type { CreateTaskGroupOptions } from '@/core/types/task-group'
import { createTaskGroup } from '@/core/task/task-group-handle'
import { toIPC } from 'bilitoolkit-runtime'

const allDataTypes = allClearableModules.map((m) => m.dataType)
const selectedDataTypes = ref<DataType[]>([])
const { toggleAll, isAllSelected } = useSelectData(selectedDataTypes, (type: DataType) => type)
const { hasActiveTaskGroup } = storeToRefs(useAppSessionStore())
const { user } = useUser()
const configModalVisible = ref<boolean>(false)
const handleClear = async () => {
  if (selectedDataTypes.value.length < 1) {
    showWarning('请选择需要清空的数据')
  } else {
    configModalVisible.value = true
  }
}
const handleExecTaskGroup = async (taskGroup: CreateTaskGroupOptions<'clear'>) => {
  const dataNames = selectedDataTypes.value.map((d) => DataTypeMap[d].name).join(', ')
  await showConfirmSequence([
    [`是否清空所选的数据？<br/>[${dataNames}]`],
    [`请检查数据是否已备份完成再继续<br/>[${dataNames}]`],
    [`最后一次提示，是否清空所选的数据？<br/>[${dataNames}]`],
  ])
  configModalVisible.value = false
  taskGroupId.value = (await createTaskGroup(toIPC(taskGroup))).id
  showToast('创建任务成功')
  taskGroupModalVisible.value = true
}
const taskGroupId = ref<number>()
const taskGroupModalVisible = ref<boolean>(false)
</script>

<template>
  <plugin-page-content>
    <div class="header">
      <div class="title">请选择需要清空的数据类型：</div>
      <div class="options">
        <el-checkbox v-model="isAllSelected" @change="toggleAll">选中所有</el-checkbox>
      </div>
    </div>
    <DataTypeList :options="allDataTypes" v-model="selectedDataTypes" />
    <el-button @click="handleClear" :disabled="hasActiveTaskGroup || !user">下一步</el-button>
    <ClearConfigModal
      v-if="user"
      v-model="configModalVisible"
      :data-types="selectedDataTypes"
      :user="user"
      @submit="handleExecTaskGroup"
    />
    <TaskGroupModal
      v-if="taskGroupId"
      v-model="taskGroupModalVisible"
      :task-group-id="taskGroupId"
      :auto-exec="true"
    ></TaskGroupModal>
  </plugin-page-content>
</template>

<style scoped lang="scss">
.header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  .title {
    font-size: 14px;
  }
}
</style>
