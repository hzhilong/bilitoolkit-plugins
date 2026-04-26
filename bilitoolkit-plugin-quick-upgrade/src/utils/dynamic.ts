import { type Dynamic, DynamicTypeMap, BiliClient } from '@ybgnb/bili-api'
import { popularStore } from '../stores/popular'

export async function getVideoAid(
  client: BiliClient,
  dynamicList: Dynamic[] | null,
  startIndex: number = 0,
  signal?: AbortSignal | undefined,
) {
  const result = await getVideoAids(client, dynamicList, 1, startIndex, signal)
  return {
    aid: result.aids[0],
    bvid: result.bvids[0],
    index: result.index,
  }
}

export async function getVideoAids(
  client: BiliClient,
  dynamicList: Dynamic[] | null,
  count: number = 1,
  startIndex: number = 0,
  signal?: AbortSignal | undefined,
): Promise<{
  index: number
  aids: number[]
  bvids: string[]
}> {
  let index = startIndex
  const aids: Array<number> = []
  const bvids: Array<string> = []
  if (count < 1) return { index, aids, bvids }

  if (dynamicList) {
    for (; index < dynamicList.length; index++) {
      const dynamic = dynamicList[index]
      if (dynamic.type === DynamicTypeMap.DYNAMIC_TYPE_AV.type) {
        const aid = dynamic.modules.module_dynamic.major?.archive?.aid
        const bvid = dynamic.modules.module_dynamic.major?.archive?.bvid
        if (aid && bvid) {
          aids.push(Number(aid))
          bvids.push(bvid)
          if (aids.length >= count) {
            return { index, aids, bvids }
          }
        }
      }
    }
  }

  if (aids.length < count) {
    const popularList = await popularStore.get(client, signal)
    if (!popularList || popularList.length < count - aids.length) throw new Error('获取热门视频失败')

    aids.push(...popularList.slice(0, count - aids.length).map((v) => v.aid))
    bvids.push(...popularList.slice(0, count - aids.length).map((v) => v.bvid))
  }

  return { index, aids, bvids }
}
