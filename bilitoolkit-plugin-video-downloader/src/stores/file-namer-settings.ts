import { cloneDeep } from 'lodash-es'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { toolkitApi } from 'bilitoolkit-ui'
import { DB_NAMES } from '@/constants/db'
import type { FileNamerSettings } from '@/types/file-namer'
import { defaultFileNamerSettings } from '@/config/defaults'

/**
 * 文件命名模板的设置
 */
export const useFileNamerSettingsStore = defineStore(
  'bilitoolkit-plugin-video-downloader-file-namer-fields',
  () => {
    const settings = ref<FileNamerSettings>(defaultFileNamerSettings())

    const reset = async () => {
      settings.value = defaultFileNamerSettings()
    }

    const init = async () => {
      const dbConfig = (await toolkitApi.db.init(
        DB_NAMES.FILE_NAMER_SETTINGS,
        defaultFileNamerSettings(),
      )) as FileNamerSettings
      Object.assign(settings.value, dbConfig)
    }
    watch(
      () => settings.value,
      (newVal) => {
        toolkitApi.db.write(DB_NAMES.FILE_NAMER_SETTINGS, cloneDeep(newVal)).then()
      },
      { deep: true },
    )

    return { init, settings, reset }
  },
  {
    persist: false,
  },
)
