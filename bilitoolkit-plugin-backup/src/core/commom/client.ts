import { BiliClient } from '@ybgnb/bili-api'
import type { BiliApiMethod } from 'bilitoolkit-types'
import { toolkitApi } from 'bilitoolkit-ui'

export const publicClient = new BiliClient()

export const invokeBiliApi = async <AM extends BiliApiMethod>(
  clientId: string,
  apiInvokePath: AM,
  ...args: Parameters<AM>
): Promise<ReturnType<AM>> => {
  return toolkitApi.bili.invokeBiliApi(clientId, apiInvokePath, ...args)
}
