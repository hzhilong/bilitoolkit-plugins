import { cloneDeep } from 'lodash-es'
import { defineStore } from 'pinia'
import { watch, ref } from 'vue'
import type { AppSettings } from '@/types/settings'
import { toolkitApi } from 'bilitoolkit-ui'
import { defaultAppSettings } from '@/config/defaults'
import { DB_NAMES } from '@/constants/db'

/**
 * 应用设置
 */
export const useAppSettingsStore = defineStore(
  'bilitoolkit-plugin-video-downloader-settings',
  () => {
    const appSettings = ref<AppSettings>(defaultAppSettings())

    const init = async () => {
      // 获取数据库配置
      const dbConfig = (await toolkitApi.db.init(DB_NAMES.APP_SETTINGS, defaultAppSettings())) as AppSettings
      Object.assign(appSettings.value, dbConfig)
    }

    const reset = async () => {
      appSettings.value = defaultAppSettings()
    }

    // 设置变化后更新数据库
    watch(
      () => appSettings.value,
      (newVal) => {
        // 写入配置
        toolkitApi.db.write(DB_NAMES.APP_SETTINGS, cloneDeep(newVal)).then()
      },
      { deep: true },
    )

    return { init, reset, appSettings }
  },
  {
    // 自己实现配置的持久化
    persist: false,
  },
)
