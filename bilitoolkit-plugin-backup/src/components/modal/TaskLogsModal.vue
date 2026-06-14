<script setup lang="ts">
import { watch, useTemplateRef } from 'vue'
import { PageTable, type PageParams, type FetchPage } from 'bilitoolkit-ui'
import { taskLogService } from '@/core/service/task-log'
import type { TaskLog } from '@/core/types/log'
import type { ComponentExposed } from 'vue-component-type-helpers'

const props = defineProps<{ taskId: number }>()
const visible = defineModel({ required: true, type: Boolean })

const fetchPage: FetchPage<TaskLog> = async (pageParams: PageParams) => {
  return await taskLogService.fetchPage(pageParams, props.taskId)
}
const tableRef = useTemplateRef<ComponentExposed<typeof PageTable<TaskLog, never>>>('tableRef')

watch(visible, (newVal) => {
  if (newVal) {
    tableRef.value?.refresh()
  }
})
</script>

<template>
  <div class="task-logs-modal">
    <el-dialog
      title="任务日志"
      v-model="visible"
      width="94%"
      :close-on-click-modal="true"
      :close-on-press-escape="true"
      :show-close="true"
      align-center
    >
      <PageTable
        class="task-log-page-table"
        ref="tableRef"
        :fetch-page="fetchPage"
        :page-sizes="[20, 50, 100]"
        searchActionLabel="刷新"
        :actions="['search']"
      >
        <el-table-column prop="taskId" label="任务 ID" width="80px"></el-table-column>
        <el-table-column prop="createdAt" label="日志时间" width="150px">
          <template #default="{ row }">
            {{ new Date((row as TaskLog).createdAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="content" label="日志内容"></el-table-column>
      </PageTable>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.task-logs-modal {
  display: contents;

  ::v-deep(> .el-modal-dialog > .el-overlay-dialog > .el-dialog) {
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    .el-dialog__body {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      display: flex;
      flex-direction: column;

      .task-log-page-table {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-height: 100%;
        flex: 1;
        min-height: 0;
        padding: 10px;
        box-sizing: border-box;

        &__header {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: flex-end;
          margin-bottom: 10px;

          &__label {
            font-size: 1.1em;
            font-weight: bold;
            margin-right: auto;
          }
        }

        &__page {
          margin-top: 10px;
        }
      }
    }
  }
}
</style>
