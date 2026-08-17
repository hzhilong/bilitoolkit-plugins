import type { CacheState } from '@/types'
import { db } from '@/db/db'

export class CacheStateRepo {
  async findByUid(uid: number): Promise<CacheState | undefined> {
    return db.cacheState.get(uid)
  }

  async put(state: CacheState): Promise<number> {
    return db.cacheState.put(state)
  }

  async delete(uid: number): Promise<void> {
    return db.cacheState.delete(uid)
  }
}

export const cacheStateRepo = new CacheStateRepo()
