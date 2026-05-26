import type { BackupNormalOptions } from '@/core/types/backup'
import type { RestoreNormalOptions } from '@/core/types/restore'
import type { TreeNodeDataRange, TreeDataRange } from '@/core/types/data-range'
import { ref, type Ref } from 'vue'
import type { ExecuteOptions } from '@/core/types/execute'
import type { OperationType } from '@/core/types/operation'

type TreeNormalOptions<O extends Exclude<OperationType, 'clear'>> = O extends 'backup'
  ? BackupNormalOptions
  : RestoreNormalOptions

export const useTreeSelect = <
  O extends Exclude<OperationType, 'clear'>,
  T extends TreeNormalOptions<O> = TreeNormalOptions<O>,
>(
  options: Ref<ExecuteOptions<O>>,
) => {
  const getTreeNodeDataRangeInfo = (node: TreeNodeDataRange) => {
    const children = node.childrenDataRange
    const cType = children.type
    const pageInfo = cType === 'page' ? ` [${children.ranges[0]} - ${children.ranges[1]}]` : ''
    return `● ${node._name}${pageInfo}`
  }

  const treeModalNodes = ref<TreeNodeDataRange[]>([])

  const treeModalVisible = ref<boolean>(false)

  const handleOpenTreeModal = (nodes: TreeNodeDataRange[]) => {
    treeModalNodes.value = nodes
    treeModalVisible.value = true
  }

  const handleTreeRangeSubmit = (nodes: TreeNodeDataRange[]) => {
    ;((options.value as unknown as T).dataRange as TreeDataRange).nodes = nodes
  }

  return {
    getTreeNodeDataRangeInfo,
    treeModalNodes,
    treeModalVisible,
    handleOpenTreeModal,
    handleTreeRangeSubmit,
  }
}
