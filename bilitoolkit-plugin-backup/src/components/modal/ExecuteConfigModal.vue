<script setup lang="ts" generic="O extends OperationType = OperationType">
import { watch, useTemplateRef, reactive } from 'vue'
import { showError } from 'bilitoolkit-ui'
import type { DataType } from '@/core/types/data-type'
import type { TaskGroupItem, CreateTaskGroupOptions } from '@/core/types/task-group'
import { getDefaultExecuteOptions } from '@/utils/default-config'
import { type OperationType, OperationTypeMap } from '@/core/types/operation'
import type { ComponentExposed } from 'vue-component-type-helpers'
import ExecuteConfig from '@/components/form/ExecuteConfig.vue'
import type { UserInfoWithCookie } from '@ybgnb/bili-api'
import { toTargetUser } from '@/core/utils/convert'
import { useExecTaskGroup } from '@/composables/useExecTaskGroup'

const props = defineProps<{
  operationType: O
  dataTypes: DataType[]
  user: UserInfoWithCookie
}>()
const visible = defineModel({ required: true, type: Boolean })
const items: Pick<TaskGroupItem<O>, 'dataType' | 'executeOptions'>[] = reactive([])
const itemRefs = useTemplateRef<ComponentExposed<typeof ExecuteConfig<O>>[]>('itemRefs')
const resetExecuteOptions = () => {
  if (!props.user) {
    items.splice(0, items.length)
  } else {
    items.splice(
      0,
      items.length,
      ...props.dataTypes.map((dataType) => {
        return {
          dataType: dataType,
          executeOptions: getDefaultExecuteOptions<O, 'normal'>(
            toTargetUser(props.user),
            props.operationType,
            dataType,
            'normal',
          ),
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
    resetExecuteOptions()
  }
})

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'submit', taskGroup: CreateTaskGroupOptions<O>): void
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
  emit('submit', {
    operationType: props.operationType,
    user: props.user,
    items: items,
  })
}
</script>

<template>
  <div class="execute-config-modal">
    <el-dialog
      :title="`${OperationTypeMap[operationType]}任务配置`"
      v-model="visible"
      width="76%"
      style="max-width: 600px; min-width: 400px; max-height: 90vh; overflow: hidden"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="true"
      align-center
    >
      <div class="content" v-if="user && items.length > 0">
        <ExecuteConfig
          ref="itemRefs"
          v-for="item in items"
          :key="item.dataType"
          :user="toTargetUser(user)"
          :operation-type="operationType"
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
.execute-config-modal ::v-deep(.el-dialog) {
  //  background-color: var(--el-bg-color-page);
}
.content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 10px 8px;
}
</style>
