<script setup lang="ts">
import { PluginPageContent, showToast } from 'bilitoolkit-ui'
import { ref } from 'vue'
import { registeredModuleTypes } from '@/core/modules/register'
import { type DataType, AllDataTypes } from '@/core/types/data-type'
import { appEnv } from '@ybgnb/vite-env/common'
import type { CreateTaskGroupOptions } from '@/core/types/task-group'
import { useUser } from '@/composables/useUser'
import { createTaskGroup } from '@/core/task/task-group-handle'
import { toIPC } from 'bilitoolkit-runtime'
import { useAppSessionStore } from '@/stores/app-session'
import { storeToRefs } from 'pinia'

const allDataTypes = appEnv.DEV ? AllDataTypes.map((t) => t.type) : registeredModuleTypes
const selectedDataTypes = ref<DataType[]>([])
const isSelectAll = ref<boolean>(false)
const selectAll = () => {
  if (isSelectAll.value) {
    selectedDataTypes.value.splice(0, selectedDataTypes.value.length, ...allDataTypes)
  } else {
    selectedDataTypes.value.splice(0, selectedDataTypes.value.length)
  }
}
const { user } = useUser()
const { hasActiveTaskGroup } = storeToRefs(useAppSessionStore())
const visibleExecuteConfigModal = ref<boolean>(false)
const handleExecTaskGroup = async (taskGroup: CreateTaskGroupOptions<'backup'>) => {
  visibleExecuteConfigModal.value = false
  taskGroupId.value = (await createTaskGroup(toIPC(taskGroup))).id
  showToast('创建任务成功')
  taskGroupModalVisible.value = true
}
const taskGroupId = ref<number>()
const taskGroupModalVisible = ref(false)
</script>

<template>
  <plugin-page-content>
    <div class="header">
      <p class="desc">请选择需要备份的数据类型：</p>
      <div class="options">
        <el-checkbox v-model="isSelectAll" @change="selectAll">选中所有</el-checkbox>
      </div>
    </div>
    <DataTypeList :options="allDataTypes" v-model="selectedDataTypes" />
    <el-button @click="visibleExecuteConfigModal = true" :disabled="hasActiveTaskGroup || !user">下一步</el-button>
    <ExecuteConfigModal
      v-if="user"
      v-model="visibleExecuteConfigModal"
      :operation-type="'backup'"
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
}

.log-print-box {
  flex: 1;
  min-height: 0;
  line-height: 1.4;
}
</style>
