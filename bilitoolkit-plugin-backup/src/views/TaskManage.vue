<script setup lang="ts">
import { type TaskGroupFilters, TaskGroupStatusMap, type TaskGroup, type TaskGroupId } from '@/core/types/task-group'
import { ref } from 'vue'
import { taskGroupService } from '@/core/service/task-group'
import { PageTable, type PageParams, BiliUserInfo } from 'bilitoolkit-ui'
import type { ElForm } from 'element-plus'
import { OperationTypeMap } from '@/core/types/operation'
import { default as TaskGroupItemsTag } from '@/components/tags/TaskGroupItemsTag'
import { formatCreatedAt, formatOperationType, formatTaskGroupStatus } from '@/utils/formatter'

const params = ref<TaskGroupFilters>({
  operationType: undefined,
  status: undefined,
})

const fetchPage = (pageParams: PageParams, filters: TaskGroupFilters) => {
  return taskGroupService.fetchPage(pageParams, filters)
}
const resetQuery = () => {
  params.value.operationType = undefined
  params.value.status = undefined
}
const taskGroupModalId = ref<TaskGroupId>()
const taskGroupModalVisible = ref(false)

const handleOpenModal = (row: TaskGroup) => {
  taskGroupModalId.value = row.id
  taskGroupModalVisible.value = true
}
</script>

<template>
  <div class="task-group-container">
    <PageTable :fetch-page="fetchPage" :page-sizes="[20]" :query-params="params" @reset="resetQuery">
      <ElTableColumn align="center" prop="id" label="id"></ElTableColumn>
      <ElTableColumn align="center" prop="createdAt" label="创建时间" :formatter="formatCreatedAt"></ElTableColumn>
      <ElTableColumn align="center" prop="operationType" label="类型" :formatter="formatOperationType"></ElTableColumn>
      <ElTableColumn align="center" prop="user" label="用户">
        <template #default="{ row }: { row: TaskGroup }">
          <BiliUserInfo :user="row.user" />
        </template>
      </ElTableColumn>
      <ElTableColumn align="center" prop="status" label="状态" :formatter="formatTaskGroupStatus"></ElTableColumn>
      <ElTableColumn align="center" prop="progress" label="进度">
        <template #default="{ row }: { row: TaskGroup }">
          <el-progress
            class="task-group-progress"
            :percentage="row.progress"
            :stroke-width="12"
            :show-text="false"
            :striped="row.status === 'running'"
            :striped-flow="row.status === 'running'"
          ></el-progress>
          <span>{{ row.progressMsg }}</span>
        </template>
      </ElTableColumn>
      <ElTableColumn align="center" prop="items" label="数据">
        <template #default="{ row }: { row: TaskGroup }">
          <TaskGroupItemsTag :items="row.items"></TaskGroupItemsTag>
        </template>
      </ElTableColumn>
      <ElTableColumn align="center" label="操作">
        <template #default="{ row }: { row: TaskGroup }">
          <ElButton type="primary" link @click="handleOpenModal(row)">查看</ElButton>
        </template>
      </ElTableColumn>
      <template #query>
        <ElForm :inline="true" label-position="left" label-width="auto">
          <ElFormItem label="类型">
            <ElSelect v-model="params.operationType" clearable placeholder="">
              <ElOption v-for="(value, key) in OperationTypeMap" :key="key" :value="key" :label="value"></ElOption>
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="状态">
            <ElSelect v-model="params.status" clearable placeholder="">
              <ElOption v-for="(value, key) in TaskGroupStatusMap" :key="key" :value="key" :label="value"></ElOption>
            </ElSelect>
          </ElFormItem>
        </ElForm>
      </template>
    </PageTable>
    <TaskGroupModal :taskGroupId="taskGroupModalId" :autoExec="false" v-model="taskGroupModalVisible"></TaskGroupModal>
  </div>
</template>

<style scoped lang="scss">
.task-group-container {
  margin-top: 20px;
}
</style>
