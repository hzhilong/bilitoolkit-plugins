import Dexie, { type EntityTable } from 'dexie'
import type { LoadStateEntity } from 'bili-comment-core'
import type { BiliCommentEntity } from 'bili-comment-core/src'

const db = new Dexie('comment-export') as Dexie & {
  comment: EntityTable<BiliCommentEntity, 'rpid'>
  loadState: EntityTable<LoadStateEntity, 'oid'>
}

db.version(2).stores({
  comment: `
    &rpid,
    [oid+ctime],
    [oid+root+ctime],
    [root+ctime]
  `,
  loadState: '&oid',
})

export { db }
