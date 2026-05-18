import type { DataModule } from '@/core/types/data-module'
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
  return {
    dataModule,
    dataModuleName,
    dataModuleColor,
    dataModuleBackupDesc,
  }
}
