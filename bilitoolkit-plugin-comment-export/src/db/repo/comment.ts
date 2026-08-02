import type { CommentStorage, BiliCommentRpId, BiliCommentEntity, BiliCommentOId } from 'bili-comment-core'
import { db } from '@/db/db'
import Dexie from 'dexie'

export class CommentRepo implements CommentStorage {
  async findByRpId(rpid: BiliCommentRpId): Promise<BiliCommentEntity | undefined> {
    return db.comment.get(rpid)
  }

  async save(comment: BiliCommentEntity): Promise<void> {
    await db.comment.put(comment)
  }

  async batchSave(list: BiliCommentEntity[]): Promise<void> {
    await db.comment.bulkPut(list)
  }

  async getList(oid: BiliCommentOId): Promise<BiliCommentEntity[]> {
    return db.comment.where('[oid+ctime]').between([oid, Dexie.minKey], [oid, Dexie.maxKey]).reverse().toArray()
  }

  async getRootList(oid: BiliCommentOId): Promise<BiliCommentEntity[]> {
    return db.comment
      .where('[oid+root+ctime]')
      .between([oid, '0', Dexie.minKey], [oid, '0', Dexie.maxKey])
      .reverse()
      .toArray()
  }

  async getSubList(root: BiliCommentRpId): Promise<BiliCommentEntity[]> {
    return db.comment.where('[root+ctime]').between([root, Dexie.minKey], [root, Dexie.maxKey]).reverse().toArray()
  }

  async delete(rpid: BiliCommentRpId): Promise<void> {
    await db.comment.delete(rpid)
  }

  async deleteAll(): Promise<void> {
    await db.comment.clear()
  }

  async getCount(): Promise<number> {
    return db.comment.count()
  }
}
