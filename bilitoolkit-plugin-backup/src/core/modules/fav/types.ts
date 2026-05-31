import type { FavFolderMeta, FavItem as BaseFavItem } from '@ybgnb/bili-api'
import type { Parent, Child } from '@/core/types/data-module'

export type FavFolder = FavFolderMeta & Parent<FavItem>
export type FavItem = BaseFavItem & Child

export const toVideoFavItems = (items: BaseFavItem[]): FavItem[] => {
  return items.map((item) => ({
    ...item,
    _id: String(item.id),
    _name: item.title,
    parentIds: [],
  }))
}

export const toVideoFavFolders = (parents: FavFolderMeta[]): FavFolder[] => {
  return parents.map((parent) => {
    return {
      ...parent,
      _id: String(parent.id),
      _name: parent.title,
      children: [],
      childrenSize: 0,
      childrenTotal: parent.media_count,
    }
  })
}
