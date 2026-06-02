import { type Parent, isTreeDataModule, type Child } from '@/core/types/data-module'
import { type DataType, DataTypeMap } from '@/core/types/data-type'
import { type MaybeRefOrGetter, computed, toValue } from 'vue'
import { registeredModulesMap } from '@/core/modules/register'
import { DATA_TYPE_COLORS } from '@/common/config'
import { isBatchable, type BatchableModule } from '@/core/types/batch'
import type { DataModule } from '@/core/modules/data-module'
import type { TreeDataModule } from '@/core/modules/tree-data-module'

export const useDataModule = (dataType: MaybeRefOrGetter<DataType>) => {
  const dataModule = computed<DataModule>(() => {
    const currentType = toValue(dataType)
    return registeredModulesMap[currentType]
  })

  const dataModuleName = computed(() => {
    return dataModule.value.dataTypeName
  })

  const dataModuleColor = computed(() => {
    return DATA_TYPE_COLORS[dataModule.value.dataType]
  })

  const backupDesc = computed(() => {
    return DataTypeMap[dataModule.value.dataType].backupDesc
  })

  const restoreDesc = computed(() => {
    return DataTypeMap[dataModule.value.dataType].restoreDesc
  })

  const clearDesc = computed(() => {
    return DataTypeMap[dataModule.value.dataType].clearDesc
  })

  const isTreeModule = computed(() => {
    return isTreeDataModule(dataModule.value)
  })

  const isBatchModule = computed(() => {
    return isBatchable(dataModule.value)
  })

  const exportTargets = computed(() => {
    return registeredModulesMap[dataModule.value.dataType].exportTargets
  })

  const batchSizes = computed(() => {
    if (isBatchModule.value) {
      return (dataModule.value as unknown as BatchableModule).batchSizes
    } else {
      return []
    }
  })

  return {
    dataModule,
    dataModuleName,
    dataModuleColor,
    backupDesc,
    restoreDesc,
    clearDesc,
    exportTargets,
    isTreeModule,
    isBatchModule,
    batchSizes,
  }
}

export const useTreeDataModule = <C extends Child, P extends Parent<C>>(dataType: MaybeRefOrGetter<DataType>) => {
  const treeDataModule = computed<TreeDataModule<C, P>>(() => {
    const currentType = toValue(dataType)
    const module = registeredModulesMap[currentType]
    if (!isTreeDataModule(module)) throw new Error(`内部错误，[${currentType}] 非树形数据模块`)
    return module as unknown as TreeDataModule<C, P>
  })

  const { dataModule: _, ...bastRest } = useDataModule(dataType)

  const treeRangeMetas = computed(() => {
    return treeDataModule.value.treeRangeMetas
  })

  const treeTopMeta = computed(() => {
    return treeRangeMetas.value[0]
  })

  return {
    ...bastRest,
    treeDataModule,
    treeRangeMetas,
    treeTopMeta,
  }
}
