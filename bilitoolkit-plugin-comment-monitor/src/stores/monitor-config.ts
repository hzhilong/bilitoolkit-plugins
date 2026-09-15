import type { MonitorConfig } from '@/types'
import { toolkitApi } from 'bilitoolkit-ui'
import { cloneDeep } from 'lodash-es'
import { defineStore } from 'pinia'
import { ref, watch, type Ref } from 'vue'

const dbKey = 'comment-monitor-config'

export const useMonitorConfigStore = defineStore(
  dbKey,
  () => {
    const monitorConfigs: Ref<MonitorConfig[]> = ref<MonitorConfig[]>([])

    const init = async () => {
      monitorConfigs.value = (await toolkitApi.db.init(dbKey, [])) as MonitorConfig[]
    }

    watch(
      () => monitorConfigs.value,
      (newVal) => {
        toolkitApi.db.write(dbKey, cloneDeep(newVal)).then()
      },
      { deep: true },
    )

    const saveMonitorConfig = async (config: MonitorConfig) => {
      for (const oldConfig of monitorConfigs.value) {
        if (oldConfig.uuid === config.uuid) {
          Object.assign(oldConfig, config)
          return
        }
      }
      monitorConfigs.value.push(config)
    }

    return { init, monitorConfigs, saveMonitorConfig }
  },
  {
    persist: false,
  },
)
