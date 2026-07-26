import { cloneDeep } from 'lodash-es'
import { defineStore } from 'pinia'
import { watch, ref } from 'vue'
import { toolkitApi } from 'bilitoolkit-ui'
import type { AppSettings } from '@/types'
import { defaultAppSettings } from '@/config/default'

/**
 * 应用设置
 */
export const useAppSettingsStore = defineStore(
  'bilitoolkit-plugin-remove-bot-followers-settings',
  () => {
    const appSettings = ref<AppSettings>(defaultAppSettings())

    const init = async () => {
      const dbConfig = (await toolkitApi.db.init('app_settings', defaultAppSettings())) as AppSettings
      Object.assign(appSettings.value, dbConfig)
    }

    const reset = async () => {
      appSettings.value = defaultAppSettings()
    }

    watch(
      () => appSettings.value,
      (newVal) => {
        toolkitApi.db.write('app_settings', cloneDeep(newVal)).then()
      },
      { deep: true },
    )

    return { init, appSettings, reset }
  },
  {
    persist: false,
  },
)
