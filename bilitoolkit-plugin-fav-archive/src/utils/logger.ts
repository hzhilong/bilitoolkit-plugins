import type { TaskPluginToolkitApi } from 'bilitoolkit-types'
import { createLogger, serializeError } from '@ybgnb/utils'

export function createAppLogger(api: TaskPluginToolkitApi) {
  return createLogger(
    async () => {
      return await api.system.getLogLevel()
    },
    (logLevel, ...args) => {
      api.system
        .saveLog({
          level: logLevel,
          data: (args ?? []).map((arg) => {
            if (arg instanceof Error) return JSON.stringify(serializeError(arg))
            return JSON.stringify(arg)
          }),
        })
        .catch((e) => {
          console.error(e)
          if (e) {
            api.system
              .saveLog({
                level: 'error',
                data: [JSON.stringify(serializeError(e))],
              })
              .catch()
          }
        })
    },
  )
}
