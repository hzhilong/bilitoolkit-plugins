import { sleepRandom } from '@ybgnb/utils'

export const apiSleep = async (abortSignal?: AbortSignal) => {
  await sleepRandom(1111, 1666, abortSignal)
}
