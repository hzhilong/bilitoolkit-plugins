import {
  type DataModule,
  type TreeDataModule,
  isTreeDataModule,
  type TreeData,
  type Data,
} from '@/core/types/data-module'
import { type DataType, DataTypeMap } from '@/core/types/data-type'
import { type MaybeRefOrGetter, computed, toValue } from 'vue'
import { registeredModulesMap } from '@/core/modules/register'
import { DATA_TYPE_COLORS } from '@/common/config'

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
  const dataModuleBackupDesc = computed(() => {
    return DataTypeMap[dataModule.value.dataType].backupDesc
  })
  const isTreeModule = computed(() => {
    return isTreeDataModule(dataModule.value)
  })
  return {
    dataModule,
    dataModuleName,
    dataModuleColor,
    dataModuleBackupDesc,
    isTreeModule,
  }
}

export const useTreeDataModule = <P extends TreeData<C>, C extends Data>(dataType: MaybeRefOrGetter<DataType>) => {
  const treeDataModule = computed<TreeDataModule<P, C>>(() => {
    const currentType = toValue(dataType)
    const module = registeredModulesMap[currentType]
    if (!isTreeDataModule(module)) throw new Error(`内部错误，[${currentType}] 非树形数据模块`)
    return module as unknown as TreeDataModule<P, C>
  })

  const dataModuleName = computed(() => {
    return treeDataModule.value.dataTypeName
  })

  const dataModuleColor = computed(() => {
    return DATA_TYPE_COLORS[treeDataModule.value.dataType]
  })
  const dataModuleBackupDesc = computed(() => {
    return DataTypeMap[treeDataModule.value.dataType].backupDesc
  })
  const treeRangeMetas = computed(() => {
    return treeDataModule.value.treeRangeMetas
  })
  const treeTopMeta = computed(() => {
    return treeRangeMetas.value[0]
  })
  return {
    treeDataModule,
    dataModuleName,
    dataModuleColor,
    dataModuleBackupDesc,
    treeRangeMetas,
    treeTopMeta,
  }
}
