import type { OperationType } from '@/core/types/operation'
import { type Ref, computed, toValue, watch, type MaybeRefOrGetter } from 'vue'
import type { ExecuteOptions, User } from '@/core/types/execute'
import {
  getDefaultExecuteOptions,
  type ExtraExecuteOptions,
  defaultAllDataRange,
  defaultPageDataRange,
  defaultTreeDataRange,
} from '@/utils/default-config'
import type { DataRangeType } from '@/core/types/data-range'
import { useDataModule } from '@/composables/useDataModule'
import { RESTORE_PAGE_SIZE } from '@/core/commom/constant'
import type { DataType } from '@/core/types/data-type'
import { isTreeDataModule } from '@/core/types/data-module'

export interface ExecuteOptionsConfig<PO extends OperationType = OperationType> {
  user: User
  operationType: PO
  dataType: DataType
  viewMode?: boolean
}

export const useExecuteOptions = <O extends OperationType = OperationType>(
  props: MaybeRefOrGetter<ExecuteOptionsConfig<O>>,
  options: Ref<ExecuteOptions<O>>,
) => {
  const { dataModule } = useDataModule(() => toValue(props).dataType)

  // 重置执行参数
  const resetExecuteOptions = () => {
    const { user, operationType, dataType } = toValue(props)
    let backupPath
    if (options.value.operationType === 'backup') {
      backupPath = options.value.rootPath
    }
    let backupTaskId
    if (options.value.operationType === 'restore') {
      backupTaskId = options.value.backupTaskId
    }

    const newOptions = getDefaultExecuteOptions<O>(user, operationType, dataType, options.value.mode ?? 'normal', {
      backupPath,
      backupTaskId,
    } as ExtraExecuteOptions<O>)

    if (options.value) {
      for (const key of Object.keys(options.value) as Array<keyof ExecuteOptions<O>>) {
        if (!(key in newOptions)) delete options.value[key]
      }
      Object.assign(options.value, newOptions)
    } else {
      options.value = newOptions
    }
  }

  // 可选的数据范围类型
  const dataRangeTypes = computed<DataRangeType[]>(() => {
    const { operationType } = toValue(props)
    if (operationType === 'backup') {
      return dataModule.value.backupDataRangeTypes
    } else if (operationType === 'restore') {
      if (isTreeDataModule(dataModule.value)) {
        return ['all', 'tree']
      } else {
        return ['all', /* 'list', */ 'page']
      }
    } else {
      return ['all']
    }
  })

  // 数据源接口的分页大小
  const pageSize = computed(() => {
    const { operationType } = toValue(props)
    if (operationType === 'restore') {
      return RESTORE_PAGE_SIZE
    } else {
      return dataModule.value.getPageSize()
    }
  })

  watch(
    () => options.value.mode,
    (newValue, oldValue) => {
      if (oldValue !== newValue) {
        resetExecuteOptions()
      }
    },
  )

  // 监听数据范围类型变化（普通模式）
  const onChangeDataRangeType = () => {
    if (options.value.mode === 'normal') {
      const dataRange = options.value.dataRange
      const type = dataRange.type
      for (const key of Object.keys(dataRange) as Array<keyof typeof dataRange>) {
        if (key !== 'type') {
          delete dataRange[key]
        }
      }
      if (type === 'all') {
        Object.assign(dataRange, defaultAllDataRange())
      } else if (type === 'page') {
        Object.assign(dataRange, defaultPageDataRange())
      } else if (type === 'tree') {
        Object.assign(dataRange, defaultTreeDataRange())
      }
    }
  }

  return {
    resetExecuteOptions,
    dataRangeTypes,
    pageSize,
    onChangeDataRangeType,
  }
}
