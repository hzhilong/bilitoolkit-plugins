import { type RelationTag, type Relation } from '@ybgnb/bili-api'
import type { TreeData, Data } from '@/core/types/data-module'

export type FollowTag = RelationTag & TreeData<Following>
export type Following = Relation & Data

export const toFollowTags = (relationTags: RelationTag[]): FollowTag[] => {
  return relationTags.map((tag) => ({
    ...tag,
    children: [],
  }))
}
