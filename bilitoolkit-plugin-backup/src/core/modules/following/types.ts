import { type RelationTag, type Relation } from '@ybgnb/bili-api'
import type { Parent, Child } from '@/core/types/data-module'

export type FollowTag = RelationTag & Parent<Following>
export type Following = Relation & Child

export const toFollowing = (relations: Relation[]): Following[] => {
  return relations.map((relation) => ({
    ...relation,
    _id: String(relation.mid),
    _name: relation.uname,
    parentIds: [],
  }))
}

export const toFollowTags = (relationTags: RelationTag[]): FollowTag[] => {
  return relationTags.map((tag) => {
    return {
      ...tag,
      _id: String(tag.tagid),
      _name: tag.name,
      children: [],
      childrenSize: 0,
      childrenTotal: tag.count,
    }
  })
}
