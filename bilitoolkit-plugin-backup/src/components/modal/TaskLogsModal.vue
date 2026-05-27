<script setup lang="ts">
import { watch, ref } from 'vue'
import { useLoadingData } from 'bilitoolkit-ui'
import { taskLogService } from '@/core/service/task-log'
import type { TaskLog } from '@/core/types/log'

const props = defineProps<{ taskId: number }>()
const visible = defineModel({ required: true, type: Boolean })

const tableData = ref<TaskLog[]>([])
const { loading, loadingData } = useLoadingData()

const refreshTableData = loadingData(async () => {
  tableData.value = await taskLogService.getAllByTaskId(props.taskId)
})

function refreshTable() {
  tableData.value = []
  refreshTableData()
}

watch(visible, (newVal) => {
  if (newVal) {
    refreshTable()
  }
})
</script>

<template>
  <el-dialog
    title="任务日志"
    v-model="visible"
    width="88%"
    style="max-height: 90vh; overflow: hidden"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
    :show-close="true"
    align-center
  >
    <div class="table-page" v-loading="loading">
      <div class="table-page__header">
        <span class="table-page__header__label"></span>
        <el-button @click="refreshTableData">刷新</el-button>
      </div>
      <div class="table-page__table">
        <el-table height="66vh" :data="tableData" style="width: 100%">
          <el-table-column prop="taskId" label="任务 ID" width="80px"></el-table-column>
          <el-table-column prop="createdAt" label="日志时间" width="150px">
            <template #default="{ row }: { row: TaskLog }">
              {{ new Date(row.createdAt).toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column prop="content" label="日志内容"></el-table-column>
        </el-table>
      </div>
    </div>
  </el-dialog>
</template>

<style scoped lang="scss">
.table-page {
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
</style>
