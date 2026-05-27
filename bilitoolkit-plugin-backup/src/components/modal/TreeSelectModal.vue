<script setup lang="ts" generic="P extends TreeData<C>, C extends Data">
import type { TreeData, Data } from '@/core/types/data-module'
import { type TreeNodeDataRange, DataRangeTypeMap, type DataRangeType } from '@/core/types/data-range'
import { ref, watch, computed, useTemplateRef, toRaw } from 'vue'
import { useLoadingData, showWarning, showError } from 'bilitoolkit-ui'
import { type OperationType, OperationTypeMap } from '@/core/types/operation'
import type { DataType } from '@/core/types/data-type'
import { useTreeDataModule } from '@/composables/useDataModule'
import { RESTORE_PAGE_SIZE } from '@/core/commom/constant'
import type { User } from '@/core/types/execute'
import { biliClientStore } from 'bilitoolkit-runtime/biliapi'

const props = defineProps<{
  user: User
  operationType: OperationType
  dataType: DataType
  backedUpData?: P[]
}>()
type ParentNode = P & {
  __selected: boolean
  __childrenDataRange: {
    type: 'all' | 'page'
    ranges: [number, number]
  }
}

const visible = defineModel<boolean>('visible', { required: true })
const defaultNodes = defineModel<TreeNodeDataRange[]>('nodes', { required: true })

const { loading, loadingData } = useLoadingData()
const { treeDataModule, treeTopMeta } = useTreeDataModule<P, C>(() => props.dataType)
const pageSize = computed(() => {
  return props.operationType === 'backup' ? treeDataModule.value.getPageSize() : RESTORE_PAGE_SIZE
})
const title = computed(() => {
  return `请选择需要${OperationTypeMap[props.operationType]}的${treeTopMeta.value.name}`
})
const childrenRangeOptions = computed<DataRangeType[]>(() => {
  return props.operationType === 'backup' ? treeDataModule.value.childrenRangeOptions : ['all', 'page']
})
const parentList = ref<ParentNode[]>([])
const formRef = useTemplateRef<InstanceType<typeof ElForm>>('formRef')

const init = loadingData(async () => {
  let list: P[] = []
  if (props.operationType === 'backup') {
    list = await treeDataModule.value.fetchAll({
      user: props.user,
      clientId: await biliClientStore.get(props.user),
    })
  } else {
    if (!props.backedUpData) {
      visible.value = false
      showError(`内部错误，不存在备份数据`)
      return
    }

    list = props.backedUpData
  }

  parentList.value = list.map((parent) => {
    const selectNode = defaultNodes.value.find((n) => n._id === parent._id)
    return {
      ...parent,
      __selected: !!selectNode,
      __childrenDataRange: Object.assign(
        {
          type: 'all',
          ranges: [1, 1] as [number, number],
        },
        selectNode?.childrenDataRange,
      ),
    } satisfies ParentNode
  })
})

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

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'submit', nodes: TreeNodeDataRange[]): void
}>()

const handleCancel = () => {
  visible.value = false
  emit('cancel')
}
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
  } catch {
    return
  }

  const result = []
  for (const parent of toRaw(parentList.value)) {
    if (parent.__selected) {
      const config = parent.__childrenDataRange
      result.push({
        _id: parent._id,
        _name: parent._name,
        childrenDataRange:
          config.type === 'all'
            ? {
                type: 'all',
              }
            : {
                type: 'page',
                ranges: config.ranges,
              },
      } satisfies TreeNodeDataRange)
    }
  }

  if (result.length === 0) {
    showWarning('未选择数据')
    return
  }

  visible.value = false
  defaultNodes.value = result
  emit('submit', result)
}
function validatePageRange(_: unknown, value: number[], callback: (error?: string | Error | undefined) => void) {
  const [start, end] = value ?? []

  if (start == null || end == null) {
    callback(new Error('请输入完整页码范围'))
    return
  }

  if (start > end) {
    callback(new Error('起始页不能大于结束页'))
    return
  }

  callback()
}
const handleItemSelect = (index: number) => {
  if (!!treeTopMeta.value.multipleSelectable) return
  const node = parentList.value[index]
  if (node.__selected) {
    for (const parent of parentList.value) {
      if (parent._id !== node._id) {
        parent.__selected = false
      }
    }
  }
}
const handleChildrenChange = (index: number) => {
  const node = parentList.value[index]
  node.__childrenDataRange = { type: node.__childrenDataRange.type, ranges: [1, 1] }
}
</script>

<template>
  <div class="dialog">
    <el-dialog
      :title="title"
      v-model="visible"
      style="min-width: 300px; max-width: 700px; max-height: 88vh; overflow: auto"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="true"
      align-center
    >
      <div class="dialog-content" v-loading="loading">
        <el-form ref="formRef" class="node-list" :model="parentList">
          <div class="node-item" v-for="(p, index) in parentList" :key="p._id" :class="p.__selected ? 'selected' : ''">
            <div class="">
              <el-checkbox class="item-checkbox" v-model="p.__selected" @change="handleItemSelect(index)">
                <span class="item-title">{{ p._name }}</span>
                <span class="item-count">{{ p.childrenTotal != null ? p.childrenTotal : '' }}</span>
              </el-checkbox>
            </div>
            <div v-if="p.__selected" class="children-config">
              <el-form-item label="数据范围">
                <el-radio-group v-model="p.__childrenDataRange.type" @change="handleChildrenChange(index)">
                  <el-radio v-for="type in childrenRangeOptions" :key="type" :value="type">
                    {{ DataRangeTypeMap[type] }}
                  </el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item
                v-if="p.__childrenDataRange.type === 'page'"
                class="children-config-page"
                label="分页范围"
                :prop="`${index}.__childrenDataRange.ranges`"
                :rules="[
                  {
                    validator: validatePageRange,
                    trigger: 'blur',
                  },
                ]"
              >
                <el-input
                  type="number"
                  v-model.number="p.__childrenDataRange.ranges[0]"
                  :min="1"
                  :max="p.childrenTotal ? Math.ceil(p.childrenTotal / pageSize) : Infinity"
                ></el-input>
                <span>-</span>
                <el-input
                  type="number"
                  v-model.number="p.__childrenDataRange.ranges[1]"
                  :min="1"
                  :max="p.childrenTotal ? Math.ceil(p.childrenTotal / pageSize) : Infinity"
                ></el-input>
                <span class="page-size">每页{{ pageSize }}</span>
              </el-form-item>
            </div>
          </div>
        </el-form>
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
.node-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-sizing: border-box;
  padding: 10px;

  .node-item {
    box-sizing: border-box;
    padding: 4px 20px;
    border-radius: 10px;
    border: 1px solid var(--el-border-color);

    &.selected {
      border-color: var(--el-color-primary);
    }

    .item-checkbox {
      width: 100%;

      ::v-deep(.el-checkbox__label) {
        width: 100%;
        display: flex;
        flex-wrap: nowrap;
        align-items: center;
        justify-content: space-between;
        font-size: 16px;

        .item-title {
          color: var(--el-text-color-regular);
        }
        .item-count {
          color: var(--el-text-color-secondary);
        }
      }
    }

    .children-config {
      .children-config-page {
        ::v-deep(.el-form-item__content) {
          display: flex;
          align-items: center;
          flex-wrap: nowrap;
          gap: 10px;
        }

        ::v-deep(.el-input) {
          width: 60px;
        }
      }
    }
  }
}
</style>
