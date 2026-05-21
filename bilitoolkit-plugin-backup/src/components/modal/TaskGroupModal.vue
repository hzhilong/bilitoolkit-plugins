<script setup lang="ts" generic="O extends OperationType = OperationType">
import { watch, ref } from 'vue'
import { type TaskGroup, type TaskGroupId } from '@/core/types/task-group'
import type { OperationType } from '@/core/types/operation'
import { useLoadingData } from 'bilitoolkit-ui'
import { taskGroupService } from '@/core/service/task-group'
import type TaskGroupCard from '@/components/card/TaskGroupCard.vue'

const props = defineProps<{
  taskGroupId?: TaskGroupId
  autoExec?: boolean
}>()
const taskGroup = ref<TaskGroup<O>>()
const { loading, loadingData } = useLoadingData()
const init = loadingData(async () => {
  if (props.taskGroupId) {
    taskGroup.value = await taskGroupService.getById<O>(props.taskGroupId)
  } else {
    taskGroup.value = undefined
  }
})
const visible = defineModel({ required: true, type: Boolean })
watch(
  () => visible.value,
  (newVal, oldVal) => {
    if (newVal && newVal !== oldVal) {
      init()
    }
  },
  {
    immediate: true,
  },
)
</script>

<template>
  <div class="dialog">
    <el-dialog
      title="任务组"
      v-model="visible"
      @update:model-value="visible = $event"
      width="66%"
      style="max-width: 600px; min-width: 400px; max-height: 90vh; overflow: hidden"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="true"
      align-center
    >
      <div class="dialog-content" v-loading="loading">
        <el-empty v-if="!taskGroup && !loading" description="内部错误，不存在任务组"></el-empty>
        <TaskGroupCard
          v-if="taskGroup"
          v-model="taskGroup"
          :auto-exec="autoExec"
          :show-box-shadow="false"
        ></TaskGroupCard>
      </div>

      <template #footer>
        <div class="dialog-footer"></div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss"></style>
