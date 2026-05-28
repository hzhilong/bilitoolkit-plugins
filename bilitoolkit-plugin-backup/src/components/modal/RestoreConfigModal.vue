<script setup lang="ts">
import { watch, useTemplateRef, ref, toRaw } from 'vue'
import { showError } from 'bilitoolkit-ui'
import type { TaskGroupItem, CreateTaskGroupOptions } from '@/core/types/task-group'
import { getDefaultExecuteOptions } from '@/utils/default-config'
import type { ComponentExposed } from 'vue-component-type-helpers'
import type RestoreConfig from '@/components/form/RestoreConfig.vue'
import type { Task } from '@/core/types/task'
import type { User } from '@/core/types/execute'
import { assertUserLoggedIn } from '@/utils/assert'

const props = defineProps<{
  tasks: Task<'backup'>[]
  user: User
}>()

const visible = defineModel({ required: true, type: Boolean })
const items = ref<Pick<TaskGroupItem<'restore'>, 'dataType' | 'executeOptions'>[]>([])

const init = async () => {
  assertUserLoggedIn(props.user)
  // 设置默认的执行参数
  items.value.splice(
    0,
    items.value.length,
    ...props.tasks.map((task) => {
      return {
        dataType: task.dataType,
        executeOptions: getDefaultExecuteOptions<'restore', 'normal'>(props.user, 'restore', task.dataType, 'normal', {
          backupTaskId: task.id,
        }),
      }
    }),
  )
}

watch(visible, (newVal) => {
  if (newVal) {
    try {
      assertUserLoggedIn(props.user)
    } catch {
      showError('用户未登录')
      visible.value = false
      return
    }
    init()
  }
})

const itemRefs = useTemplateRef<ComponentExposed<typeof RestoreConfig>[]>('itemRefs')
const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'submit', taskGroup: CreateTaskGroupOptions<'restore'>): void
}>()

const handleCancel = () => {
  visible.value = false
  emit('cancel')
}
const handleSubmit = async () => {
  if (!itemRefs.value) return
  assertUserLoggedIn(props.user)
  for (const itemRef of itemRefs.value!) {
    if (!(await itemRef.validate())) return
  }
  visible.value = false
  emit('submit', {
    operationType: 'restore',
    user: props.user,
    items: toRaw(items.value),
  })
}
</script>

<template>
  <div class="execute-config-modal">
    <el-dialog
      title="还原任务配置"
      v-model="visible"
      width="76%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="true"
      align-center
    >
      <div class="content" v-if="user && items.length > 0">
        <RestoreConfig
          ref="itemRefs"
          v-for="(item, index) in items"
          :key="item.dataType"
          :user="user"
          :data-type="item.dataType"
          :backup-task="tasks[index]"
          v-model="item.executeOptions"
        />
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确认</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
@use '@/assets/scss/execute-config-modal';
</style>
