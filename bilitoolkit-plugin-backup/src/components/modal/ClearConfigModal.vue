<script setup lang="ts">
import { watch, useTemplateRef, toRaw, ref } from 'vue'
import { showError, showConfirmSequence } from 'bilitoolkit-ui'
import { type DataType, DataTypeMap } from '@/core/types/data-type'
import type { TaskGroupItem, CreateTaskGroupOptions } from '@/core/types/task-group'
import { getDefaultExecuteOptions } from '@/utils/default-config'
import type { ComponentExposed } from 'vue-component-type-helpers'
import type ClearConfig from '@/components/form/ClearConfig.vue'
import type { User } from '@/core/types/execute'
import { assertUserLoggedIn } from '@/utils/assert'

const props = defineProps<{
  dataTypes: DataType[]
  user: User
}>()
const visible = defineModel({ required: true, type: Boolean })
const items = ref<Pick<TaskGroupItem<'clear'>, 'dataType' | 'executeOptions'>[]>([])
const itemRefs = useTemplateRef<ComponentExposed<typeof ClearConfig>[]>('itemRefs')
const resetAllExecuteOptions = () => {
  if (!props.user) {
    items.value.splice(0, items.value.length)
  } else {
    items.value.splice(
      0,
      items.value.length,
      ...props.dataTypes.map((dataType) => {
        return {
          dataType: dataType,
          executeOptions: getDefaultExecuteOptions<'clear', 'normal'>(props.user, 'clear', dataType, 'normal', {}),
        }
      }),
    )
  }
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
    resetAllExecuteOptions()
  }
})

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'submit', taskGroup: CreateTaskGroupOptions<'clear'>): void
}>()

const handleCancel = () => {
  visible.value = false
  emit('cancel')
}
const handleSubmit = async () => {
  if (!itemRefs.value) return
  assertUserLoggedIn(props.user)
  const dataNames = props.dataTypes.map((d) => DataTypeMap[d].name).join(', ')
  await showConfirmSequence([
    [`是否清空所选的数据？<br/>[${dataNames}]`],
    [`请检查数据是否已备份完成再继续<br/>[${dataNames}]`],
    [`最后一次提示，是否清空所选的数据？<br/>[${dataNames}]`],
  ])
  visible.value = false
  emit('submit', {
    operationType: 'clear',
    user: props.user,
    items: toRaw(items.value),
  })
}
</script>

<template>
  <div class="execute-config-modal">
    <el-dialog
      title="清空任务配置"
      v-model="visible"
      width="76%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="true"
      align-center
    >
      <div class="content" v-if="user && items.length > 0">
        <ClearConfig
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
