import { cloneDeep } from 'lodash-es'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { toolkitApi } from 'bilitoolkit-ui'
import type { FileNamerSettings } from '@/types/file-namer'
import { defaultFileNamerSettings } from '@/config/default'

const dbKey = 'opus-downloader-file-namer-fields'

/**
 * 文件命名模板的设置
 */
export const useFileNamerSettingsStore = defineStore(
  dbKey,
  () => {
    const settings = ref<FileNamerSettings>(defaultFileNamerSettings())

    const reset = async () => {
      settings.value = defaultFileNamerSettings()
    }

    const init = async () => {
      const dbConfig = (await toolkitApi.db.init(dbKey, defaultFileNamerSettings())) as FileNamerSettings
      Object.assign(settings.value, dbConfig)
    }
    watch(
      () => settings.value,
      (newVal) => {
        toolkitApi.db.write(dbKey, cloneDeep(newVal)).then()
      },
      { deep: true },
    )

    return { init, settings, reset }
  },
  {
    persist: false,
  },
)
