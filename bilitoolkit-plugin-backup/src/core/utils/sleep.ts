import { sleepRandom } from '@ybgnb/utils'
import { useAppSettingsStore } from '@/stores/app-settings'

export const apiSleep = async (abortSignal?: AbortSignal) => {
  const settings = useAppSettingsStore().appSettings
  await sleepRandom(
    settings.businessRequestIntervalMinMs ?? 1333,
    settings.businessRequestIntervalMaxMs ?? 2233,
    abortSignal,
  )
}
