import type { AppSettings } from '@/types'

export const defaultAppSettings = () => {
  return {
    enableCache: true,
    cacheSyncRefreshHotCommentLimit: 50,
    cacheSyncRefreshTimeCommentLimit: 100,
  } as AppSettings
}
