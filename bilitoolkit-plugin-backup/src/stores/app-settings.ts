import { cloneDeep } from 'lodash-es'
import { defineStore } from 'pinia'
import { reactive, watch } from 'vue'
import type { AppSettings } from '@/types/settings'
import { defaultAppSettings, DB_NAMES } from '@/common/config'
import { toolkitApi } from 'bilitoolkit-ui'

/**
 * 应用设置
 */
export const useAppSettingsStore = defineStore(
  'bilitoolkit-plugin-backup-settings',
  () => {
    const appSettings = reactive<AppSettings>(defaultAppSettings)

    const init = async () => {
      // 获取数据库配置
      const dbConfig = (await toolkitApi.db.init(DB_NAMES.APP_SETTINGS, defaultAppSettings)) as AppSettings
      Object.assign(appSettings, dbConfig)
    }

    // 设置变化后更新数据库
    watch(
      () => appSettings,
      (newVal) => {
        // 写入配置
        toolkitApi.db.write(DB_NAMES.APP_SETTINGS, cloneDeep(newVal)).then()
      },
      { deep: true },
    )

    return { init, appSettings }
  },
  {
    // 自己实现配置的持久化
    persist: false,
  },
)
