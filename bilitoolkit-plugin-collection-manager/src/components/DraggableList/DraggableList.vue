<script setup lang="ts" generic="T extends Record<string, any>">
import { ref, computed, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import { Top, Bottom, ArrowUp, ArrowDown, Close, Delete, Operation } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { DraggableListProps } from '@/components/DraggableList/types'

const props = withDefaults(defineProps<DraggableListProps<T>>(), {
  itemKey: 'id',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: T[]): void
  (e: 'delete', deletedItems: T[]): void
}>()

const internalList = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const selectedIds = ref<(string | number)[]>([])
const lastClickedId = ref<string | number | null>(null) // 记录上一次点击的 ID，用于 Shift 范围计算

// 判断是否选中
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isSelected = (item: T) => selectedIds.value.includes(item[props.itemKey] as any)

// --- 核心：处理点击与 Shift 范围选择 ---
const onItemCheck = (e: MouseEvent, item: T, currentIndex: number) => {
  const currentId = item[props.itemKey] as string | number
  const currentlySelected = isSelected(item)

  // 目标状态：如果当前未选中则变为选中；如果已选中则变为取消选中
  const targetState = !currentlySelected

  if (e.shiftKey && lastClickedId.value !== null && selectedIds.value.length > 0) {
    // 寻找上一次点击的项目前的真实索引 (应对拖拽排序后索引变更的情况)
    const lastIndex = internalList.value.findIndex((node) => node[props.itemKey] === lastClickedId.value)

    if (lastIndex !== -1) {
      const start = Math.min(lastIndex, currentIndex)
      const end = Math.max(lastIndex, currentIndex)

      // 提取范围内的所有 ID
      const idsInRange: (string | number)[] = []
      for (let i = start; i <= end; i++) {
        idsInRange.push(internalList.value[i][props.itemKey] as string | number)
      }

      if (targetState) {
        // 批量选中
        const newIds = idsInRange.filter((id) => !selectedIds.value.includes(id))
        selectedIds.value.push(...newIds)
      } else {
        // 批量取消选中
        selectedIds.value = selectedIds.value.filter((id) => !idsInRange.includes(id))
      }

      lastClickedId.value = currentId
      return
    }
  }

  // 正常单点切换
  if (currentlySelected) {
    selectedIds.value = selectedIds.value.filter((id) => id !== currentId)
  } else {
    selectedIds.value.push(currentId)
  }

  // 记录本次点击的 ID 作为下一次 Shift 选择的锚点
  lastClickedId.value = currentId
}

const clearSelection = () => {
  selectedIds.value = []
  lastClickedId.value = null
}

// 同步清理不存在的选中项
watch(
  () => props.modelValue,
  (newList) => {
    const validIds = newList.map((item) => item[props.itemKey] as string | number)
    selectedIds.value = selectedIds.value.filter((id) => validIds.includes(id))
    if (lastClickedId.value && !validIds.includes(lastClickedId.value)) {
      lastClickedId.value = null
    }
  },
  { deep: true },
)

// --- 批量移动逻辑 ---
const moveSelectedToTop = () => {
  const selectedItems = internalList.value.filter((item) => isSelected(item))
  const unselectedItems = internalList.value.filter((item) => !isSelected(item))
  internalList.value = [...selectedItems, ...unselectedItems]
}

const moveSelectedToBottom = () => {
  const selectedItems = internalList.value.filter((item) => isSelected(item))
  const unselectedItems = internalList.value.filter((item) => !isSelected(item))
  internalList.value = [...unselectedItems, ...selectedItems]
}

const moveSelectedUp = () => {
  const list = [...internalList.value]
  const indices = selectedIds.value
    .map((id) => list.findIndex((item) => item[props.itemKey] === id))
    .filter((i) => i !== -1)
    .sort((a, b) => a - b)

  for (let i = 0; i < indices.length; i++) {
    const idx = indices[i]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (idx > 0 && !selectedIds.value.includes(list[idx - 1][props.itemKey] as any)) {
      ;[list[idx - 1], list[idx]] = [list[idx], list[idx - 1]]
    }
  }
  internalList.value = list
}

const moveSelectedDown = () => {
  const list = [...internalList.value]
  const indices = selectedIds.value
    .map((id) => list.findIndex((item) => item[props.itemKey] === id))
    .filter((i) => i !== -1)
    .sort((a, b) => b - a)

  for (let i = 0; i < indices.length; i++) {
    const idx = indices[i]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (idx < list.length - 1 && !selectedIds.value.includes(list[idx + 1][props.itemKey] as any)) {
      ;[list[idx + 1], list[idx]] = [list[idx], list[idx + 1]]
    }
  }
  internalList.value = list
}

const deleteSelected = async () => {
  try {
    await ElMessageBox.confirm('确定要删除选中的列表项吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    const itemsToDelete = internalList.value.filter((item) => isSelected(item))
    internalList.value = internalList.value.filter((item) => !isSelected(item))
    clearSelection()
    emit('delete', itemsToDelete)
    ElMessage.success('删除成功')
  } catch {
    // 捕获取消
  }
}
</script>

<template>
  <div class="draggable-list-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="selection-info">
        共 <span class="highlight">{{ modelValue.length }}</span> 项
      </div>
      <div class="selection-info" v-show="selectedIds.length > 0">
        已选择 <span class="highlight">{{ selectedIds.length }}</span> 项
      </div>
      <div class="actions">
        <el-tooltip content="移到顶部" placement="top">
          <el-button :disabled="selectedIds.length === 0" size="small" :icon="Top" @click="moveSelectedToTop" />
        </el-tooltip>
        <el-tooltip content="上移" placement="top">
          <el-button :disabled="selectedIds.length === 0" size="small" :icon="ArrowUp" @click="moveSelectedUp" />
        </el-tooltip>
        <el-tooltip content="下移" placement="top">
          <el-button :disabled="selectedIds.length === 0" size="small" :icon="ArrowDown" @click="moveSelectedDown" />
        </el-tooltip>
        <el-tooltip content="移到底部" placement="top">
          <el-button :disabled="selectedIds.length === 0" size="small" :icon="Bottom" @click="moveSelectedToBottom" />
        </el-tooltip>

        <el-divider direction="vertical" class="divider" />

        <el-button :disabled="selectedIds.length === 0" size="small" :icon="Close" @click="clearSelection">
          取消选择
        </el-button>
        <el-button
          :disabled="selectedIds.length === 0"
          type="danger"
          size="small"
          :icon="Delete"
          @click="deleteSelected"
        >
          删除
        </el-button>
      </div>
    </div>
    <el-alert description="按住 shift 可实现范围选择" />
    <!-- 拖拽列表区域 -->
    <VueDraggable
      v-model="internalList"
      :animation="200"
      handle=".drag-handle"
      class="drag-area"
      v-if="internalList.length > 0"
    >
      <div
        v-for="(item, index) in internalList"
        :key="String(item[itemKey])"
        class="list-item"
        :class="{ 'is-selected': isSelected(item) }"
      >
        <!-- 拖拽手柄 -->
        <div class="drag-handle" title="按住拖拽">
          <el-icon><Operation /></el-icon>
        </div>

        <!-- 选择框包裹层 (用于捕获原生鼠标事件以识别 Shift 键) -->
        <div
          class="checkbox-wrapper"
          @click.stop="onItemCheck($event, item, index)"
          title="可按住 Shift 键进行范围多选"
        >
          <el-checkbox :model-value="isSelected(item)" style="pointer-events: none" tabindex="-1" />
        </div>

        <!-- 列表项内容插槽 -->
        <div class="item-content">
          <slot :row="item" :index="index">
            {{ item }}
          </slot>
        </div>
      </div>
    </VueDraggable>

    <!-- 空数据状态 -->
    <el-empty v-else description="暂无列表数据" />
  </div>
</template>

<style scoped>
.draggable-list-container {
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-border-radius-base);
  background-color: var(--el-bg-color);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  user-select: none;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background-color: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-light);
}

.selection-info {
  font-size: var(--el-font-size-base);
  color: var(--el-text-color-regular);
}

.selection-info .highlight {
  color: var(--el-color-primary);
  font-weight: bold;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.divider {
  margin: 0 4px;
}

.drag-area {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 0 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-bg-color);
  transition: background-color 0.3s;
}

.list-item:last-child {
  border-bottom: none;
}

.list-item:hover {
  background-color: var(--el-fill-color-lighter);
}

/* 选中态高亮 */
.list-item.is-selected {
  background-color: var(--el-color-primary-light-9);
}

.drag-handle {
  cursor: grab;
  margin-right: 16px;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  font-size: 18px;
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-handle:hover {
  color: var(--el-color-primary);
}

/* 修复复选框包装器样式，确保手势交互舒适 */
.checkbox-wrapper {
  display: flex;
  align-items: center;
  margin-right: 16px;
  cursor: pointer;
}

.item-content {
  flex: 1;
  color: var(--el-text-color-primary);
  font-size: var(--el-font-size-base);
  overflow: hidden;
}
</style>
