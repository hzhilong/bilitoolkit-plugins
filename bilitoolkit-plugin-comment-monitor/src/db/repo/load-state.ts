import type { LoadStateStorage, BiliCommentOId, LoadStateEntity } from 'bili-comment-core'
import { db } from '@/db/db'

export class LoadStateRepo implements LoadStateStorage {
  async findByOId(oid: BiliCommentOId): Promise<LoadStateEntity | undefined> {
    return db.loadState.get(oid)
  }

  async save(loadState: LoadStateEntity): Promise<void> {
    await db.loadState.put(loadState)
  }

  async update(oid: LoadStateEntity['oid'], data: Partial<Omit<LoadStateEntity, 'oid'>>): Promise<void> {
    await db.loadState.update(oid, data)
  }

  async getCount(): Promise<number> {
    return db.loadState.count()
  }

  async delete(oid: BiliCommentOId): Promise<void> {
    await db.loadState.delete(oid)
  }
}
