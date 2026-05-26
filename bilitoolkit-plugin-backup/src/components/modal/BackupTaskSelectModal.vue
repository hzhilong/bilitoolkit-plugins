<script setup lang="ts" generic="P extends TreeData<C>, C extends Data">
import type { TreeData, Data } from '@/core/types/data-module'
import { ref, watch } from 'vue'
import { useLoadingData, useSelectData } from 'bilitoolkit-ui'
import type { TaskGroup } from '@/core/types/task-group'
import type { Task } from '@/core/types/task'
import { taskService } from '@/core/service/task'
import { inArray } from '@/core/utils/array'
import { registeredModulesMap } from '@/core/modules/register'
import { getDataByBackupTask } from '@/core/utils/data-range'

const props = defineProps<{
  taskGroup: TaskGroup<'backup'>
}>()

const visible = defineModel<boolean>('visible', { required: true })
interface ExtendTask extends Task<'backup'> {
  dataTypeName: string
  dataTotalDesc: string
}
const tasks = ref<ExtendTask[]>([])
const { loading, loadingData } = useLoadingData()
const { getSelectedData, checkboxValue } = useSelectData(tasks, (task: ExtendTask) => task.id)

const init = loadingData(async () => {
  const lastId = props.taskGroup.id
  const list: ExtendTask[] = []
  for (const item of props.taskGroup.items) {
    const task = await taskService.getById<'backup'>(item.id)
    const dataModule = registeredModulesMap[task.dataType]
    if (inArray(task.status, ['completed', 'batchCompleted'])) {
      list.push({
        ...task,
        dataTypeName: dataModule.dataTypeName,
        dataTotalDesc: dataModule.getDataTotalDesc(await getDataByBackupTask(task, true)),
      })
    }
  }
  if (lastId === props.taskGroup.id) {
    tasks.value.splice(0, tasks.value.length, ...list)
  }
})

watch(
  () => visible.value,
  (newVal) => {
    if (newVal) {
      init()
    }
  },
  { immediate: true },
)

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'submit', selectedTasks: Task<'backup'>[]): void
}>()

const handleCancel = () => {
  visible.value = false
  emit('cancel')
}

const handleSubmit = async () => {
  visible.value = false
  emit('submit', getSelectedData())
}
</script>

<template>
  <div class="dialog">
    <el-dialog
      title="请选择需要还原的数据"
      v-model="visible"
      style="min-width: 300px; max-width: 700px; max-height: 88vh; overflow: auto"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="true"
      align-center
    >
      <div class="dialog-content" v-loading="loading">
        <el-checkbox-group class="tasks" v-model="checkboxValue">
          <el-checkbox class="task" v-for="task in tasks" :key="task.id" :value="task.id">
            <span class="data-name">{{ task.dataTypeName }}</span>
            <span class="total-desc">{{ task.dataTotalDesc }}</span>
          </el-checkbox>
        </el-checkbox-group>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.tasks {
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-sizing: border-box;
  padding: 10px;

  .task {
    width: 100%;
    box-sizing: border-box;
    padding: 4px 20px;
    border-bottom: 1px solid var(--el-border-color);

    ::v-deep(.el-checkbox__label) {
      width: 100%;
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      justify-content: space-between;
      font-size: 16px;

      .data-name {
        color: var(--el-text-color-regular);
      }
      .total-desc {
        color: var(--el-text-color-secondary);
      }
    }
  }
}
</style>
