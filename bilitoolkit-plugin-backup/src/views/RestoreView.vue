<script setup lang="ts">
import { PluginPageContent, PageTable, BiliUserInfo, type PageParams, showToast } from 'bilitoolkit-ui'
import { formatCreatedAt, formatTaskGroupStatus } from '@/utils/formatter'
import {
  type TaskGroup,
  type TaskGroupFilters,
  type TaskGroupId,
  type CreateTaskGroupOptions,
} from '@/core/types/task-group'
import { type Task } from '@/core/types/task'
import { TaskGroupItemsTag } from '@/components/tags/TaskGroupItemsTag'
import { taskGroupService } from '@/core/service/task-group'
import BackupTaskSelectModal from '@/components/modal/BackupTaskSelectModal.vue'
import { ref, onMounted, onUnmounted, useTemplateRef } from 'vue'
import { eventBus } from '@/utils/event-bus'
import type { ComponentExposed } from 'vue-component-type-helpers'
import { useUser } from '@/composables/useUser'
import { createTaskGroup } from '@/core/task/task-group-handle'
import { toIPC } from 'bilitoolkit-runtime'
import { allRestorableDataTypes } from '@/core/modules/register'

const { user } = useUser()
const fetchPage = async (pageParams: PageParams, _filters: TaskGroupFilters) => {
  return await taskGroupService.fetchPage(
    pageParams,
    {
      statusArr: ['batchCompleted', 'completed'],
      operationType: 'backup',
    },
    (group) => group.items.some((item) => allRestorableDataTypes.includes(item.dataType)),
  )
}
const tableRef = useTemplateRef<ComponentExposed<typeof PageTable<TaskGroup<'restore'>, TaskGroupFilters>>>('tableRef')
const onRefresh = () => {
  tableRef.value?.refresh()
}

onMounted(() => {
  eventBus.on('refreshTaskGroups', onRefresh)
})

onUnmounted(() => {
  eventBus.off('refreshTaskGroups', onRefresh)
})

const taskGroupModalVisible = ref(false)
const taskGroupModalId = ref<TaskGroupId>()
const handleOpenModal = (row: TaskGroup) => {
  taskGroupModalId.value = row.id
  taskGroupModalVisible.value = true
}

const selectModalVisible = ref(false)
const selectModalTaskGroup = ref<TaskGroup<'backup'>>()
const handleRestore = async (taskGroup: TaskGroup<'backup'>) => {
  selectModalTaskGroup.value = taskGroup
  selectModalVisible.value = true
}

const handleSelectedTasks = (selectedTasks: Task<'backup'>[]) => {
  configModalTasks.value = selectedTasks
  configModalVisible.value = true
}

const configModalVisible = ref(false)
const configModalTasks = ref<Task<'backup'>[]>([])
const handleExecTaskGroup = async (taskGroup: CreateTaskGroupOptions<'restore'>) => {
  groupModalId.value = (await createTaskGroup(toIPC(taskGroup))).id
  showToast('创建任务成功')
  groupModalVisible.value = true
}

const groupModalVisible = ref(false)
const groupModalId = ref<number>()
</script>

<template>
  <plugin-page-content>
    <PageTable
      class="backup-task-page-table"
      ref="tableRef"
      :fetch-page="fetchPage"
      :page-sizes="[20]"
      searchActionLabel="刷新"
      :actions="['search']"
    >
      <template v-slot:query>
        <div class="title">已备份的数据：</div>
      </template>
      <ElTableColumn align="center" prop="id" label="id" min-width="30px"></ElTableColumn>
      <ElTableColumn
        align="center"
        prop="createdAt"
        label="创建时间"
        :formatter="formatCreatedAt"
        minWidth="80px"
      ></ElTableColumn>
      <ElTableColumn align="center" prop="user" label="用户">
        <template #default="{ row }: { row: TaskGroup<'backup'> }">
          <BiliUserInfo :user="row.user" />
        </template>
      </ElTableColumn>
      <ElTableColumn
        align="center"
        prop="status"
        label="状态"
        :formatter="formatTaskGroupStatus"
        width="80px"
      ></ElTableColumn>
      <ElTableColumn align="center" prop="items" label="数据" width="200px">
        <template #default="{ row }: { row: TaskGroup<'backup'> }">
          <TaskGroupItemsTag :items="row.items"></TaskGroupItemsTag>
        </template>
      </ElTableColumn>
      <ElTableColumn align="center" label="操作" width="140px">
        <template #default="{ row }: { row: TaskGroup<'backup'> }">
          <ElButton type="primary" link @click="handleOpenModal(row)">查看</ElButton>
          <ElButton type="primary" link @click="handleRestore(row)">还原数据</ElButton>
        </template>
      </ElTableColumn>
    </PageTable>
    <TaskGroupModal :taskGroupId="taskGroupModalId" :autoExec="false" v-model="taskGroupModalVisible"></TaskGroupModal>
    <BackupTaskSelectModal
      v-if="selectModalTaskGroup"
      :taskGroup="selectModalTaskGroup"
      v-model:visible="selectModalVisible"
      @submit="handleSelectedTasks"
    ></BackupTaskSelectModal>
    <RestoreConfigModal
      v-if="user && configModalTasks"
      v-model="configModalVisible"
      :tasks="configModalTasks"
      :user="user"
      @submit="handleExecTaskGroup"
    />
    <TaskGroupModal
      v-if="groupModalId"
      v-model="groupModalVisible"
      :task-group-id="groupModalId"
      :auto-exec="true"
    ></TaskGroupModal>
  </plugin-page-content>
</template>

<style scoped lang="scss">
.backup-task-page-table {
  flex: 1;
  min-height: 0;

  .title {
    font-size: 14px;
    align-self: center;
  }
}
</style>
