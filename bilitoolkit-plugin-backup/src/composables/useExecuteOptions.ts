import type { OperationType } from '@/core/types/operation'
import { type Ref, computed, toValue, watch, type MaybeRefOrGetter } from 'vue'
import type { ExecuteOptions } from '@/core/types/execute'
import {
  getDefaultExecuteOptions,
  defaultAllDataRange,
  defaultPageDataRange,
  defaultListDataRange,
  defaultTreeDataRange,
} from '@/utils/default-config'
import type { ExecuteConfigProps } from '@/components/form/ExecuteConfig.vue'
import type { DataRangeType } from '@/core/types/data-range'
import { useDataModule } from '@/composables/useDataModule'

export const useExecuteOptions = <O extends OperationType = OperationType>(
  props: MaybeRefOrGetter<ExecuteConfigProps<O>>,
  options: Ref<ExecuteOptions<O>>,
) => {
  const { dataModule } = useDataModule(() => toValue(props).dataType)

  // 重置执行参数
  const resetExecuteOptions = () => {
    const { user, operationType, dataType } = toValue(props)
    options.value = getDefaultExecuteOptions<O>(user, operationType, dataType, options.value.mode ?? 'normal')
  }

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
        Object.assign(dataRange, defaultAllDataRange)
      } else if (type === 'page') {
        Object.assign(dataRange, defaultPageDataRange)
      } else if (type === 'list') {
        Object.assign(dataRange, defaultListDataRange)
      } else if (type === 'tree') {
        Object.assign(dataRange, defaultTreeDataRange)
      }
    }
  }

  // 可选的数据范围类型
  const dataRangeTypes = computed<DataRangeType[]>(() => {
    const { operationType } = toValue(props)
    if (operationType === 'backup') {
      return dataModule.value.backupDataRangeTypes
    } else if (operationType === 'restore') {
      if (!dataModule.value.treeRangeOptions) {
        return ['all', 'list', 'page']
      } else {
        return ['all', 'tree']
      }
    } else {
      return ['all']
    }
  })
  // 数据源接口的分页大小
  const dataApiPageSize = computed(() => {
    return dataModule.value.getPageSize()
  })

  watch(
    () => options.value.mode,
    (oldValue, newValue) => {
      if (oldValue !== newValue) {
        resetExecuteOptions()
      }
    },
  )
  return {
    resetExecuteOptions,
    onChangeDataRangeType,
    dataRangeTypes,
    dataApiPageSize,
  }
}
