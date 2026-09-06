import { cloneDeep } from 'lodash-es'
import { defineStore } from 'pinia'
import { watch, ref } from 'vue'
import { toolkitApi } from 'bilitoolkit-ui'
import type { AppSettings } from '@/types/settings'
import { defaultAppSettings } from '@/config/default'

const dbKey = 'opus-downloader-settings'

/**
 * 应用设置
 */
export const useAppSettingsStore = defineStore(
  dbKey,
  () => {
    const appSettings = ref<AppSettings>(defaultAppSettings())

    const init = async () => {
      const dbConfig = (await toolkitApi.db.init(dbKey, defaultAppSettings())) as AppSettings
      Object.assign(appSettings.value, dbConfig)
    }

    const reset = async () => {
      appSettings.value = defaultAppSettings()
    }

    watch(
      () => appSettings.value,
      (newVal) => {
        toolkitApi.db.write(dbKey, cloneDeep(newVal)).then()
      },
      { deep: true },
    )

    return { init, appSettings, reset }
  },
  {
    persist: false,
  },
)
