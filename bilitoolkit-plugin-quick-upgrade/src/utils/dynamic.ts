import { type Dynamic, DynamicTypeMap } from '@ybgnb/bili-api'
import { randomInt } from '@ybgnb/utils'

export function getVideoAid(dynamicList: Dynamic[] | null, startIndex: number = 0) {
  const result = getVideoAids(dynamicList, 1, startIndex)
  return {
    aid: result.aids[0],
    index: result.index,
  }
}

export function getVideoAids(
  dynamicList: Dynamic[] | null,
  count: number = 1,
  startIndex: number = 0,
): {
  index: number
  aids: number[]
} {
  let index = startIndex
  const aids: Array<number> = []
  if (count < 1) return { index, aids }

  if (dynamicList) {
    for (; index < dynamicList.length; index++) {
      const dynamic = dynamicList[index]
      if (dynamic.type === DynamicTypeMap.DYNAMIC_TYPE_AV.type) {
        const aid = dynamic.modules.module_dynamic.major?.archive?.aid
        if (aid) {
          aids.push(Number(aid))
          if (aids.length >= count) {
            return { index, aids }
          }
        }
      }
    }
  }

  for (let i = aids.length; i < count; i++) {
    aids.push(randomInt(1e9, 2e9))
  }

  return { index, aids }
}
