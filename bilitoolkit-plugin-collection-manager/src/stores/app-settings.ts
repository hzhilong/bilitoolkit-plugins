import { cloneDeep } from 'lodash-es'
import { defineStore } from 'pinia'
import { reactive, watch } from 'vue'
import { toolkitApi } from 'bilitoolkit-ui'
import type { AppSettings } from '@/types'
import { defaultAppSettings } from '@/config/default'

const dbKey = 'collection-manager-settings'

/**
 * 应用设置
 */
export const useAppSettingsStore = defineStore(
  dbKey,
  () => {
    const appSettings = reactive<AppSettings>(defaultAppSettings())

    const init = async () => {
      const dbConfig = (await toolkitApi.db.init(dbKey, defaultAppSettings())) as AppSettings
      Object.assign(appSettings, dbConfig)
    }

    watch(
      () => appSettings,
      (newVal) => {
        toolkitApi.db.write(dbKey, cloneDeep(newVal)).then()
      },
      { deep: true },
    )

    return { init, appSettings }
  },
  {
    persist: false,
  },
)
