<script setup lang="ts">
import { watch, useTemplateRef, reactive } from 'vue'
import { showError } from 'bilitoolkit-ui'
import type { DataType } from '@/core/types/data-type'
import type { TaskGroupItem, CreateTaskGroupOptions } from '@/core/types/task-group'
import { getDefaultExecuteOptions } from '@/utils/default-config'
import type { ComponentExposed } from 'vue-component-type-helpers'
import { useExecTaskGroup } from '@/composables/useExecTaskGroup'
import { getBackupRootPath } from '@/core/utils/file'
import BackupConfig from '@/components/form/BackupConfig.vue'
import type { User } from '@/core/types/execute'

const props = defineProps<{
  dataTypes: DataType[]
  user: User
}>()
const visible = defineModel({ required: true, type: Boolean })
const items: Pick<TaskGroupItem<'backup'>, 'dataType' | 'executeOptions'>[] = reactive([])
const itemRefs = useTemplateRef<ComponentExposed<typeof BackupConfig>[]>('itemRefs')
const resetAllExecuteOptions = () => {
  if (!props.user) {
    items.splice(0, items.length)
  } else {
    // 备份统一文件根目录
    const backupPath = getBackupRootPath(props.user)
    items.splice(
      0,
      items.length,
      ...props.dataTypes.map((dataType) => {
        return {
          dataType: dataType,
          executeOptions: getDefaultExecuteOptions<'backup', 'normal'>(props.user, 'backup', dataType, 'normal', {
            backupPath,
          }),
        }
      }),
    )
  }
}
const { assertUserLoggedIn } = useExecTaskGroup()

watch(visible, (newVal) => {
  if (newVal) {
    try {
      assertUserLoggedIn(props.user)
    } catch {
      showError('用户未登录')
      visible.value = false
      return
    }
    resetAllExecuteOptions()
  }
})

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'submit', taskGroup: CreateTaskGroupOptions<'backup'>): void
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
    operationType: 'backup',
    user: props.user,
    items: items,
  })
}
</script>

<template>
  <div class="execute-config-modal">
    <el-dialog
      title="备份任务配置"
      v-model="visible"
      width="76%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="true"
      align-center
    >
      <div class="content" v-if="user && items.length > 0">
        <BackupConfig
          ref="itemRefs"
          v-for="item in items"
          :key="item.dataType"
          :user="user"
          :data-type="item.dataType"
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
