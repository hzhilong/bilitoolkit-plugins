import { db } from '@/db/db'
import Dexie from 'dexie'
import type { MyArchive } from '@/types'
import { chunk } from '@ybgnb/utils'

export class MyArchivesRepo {
  /**
   * 根据 uid 查询全部合集。
   *
   * 按 pubTime 降序排列。
   */
  async findByUid(uid: number): Promise<MyArchive[]> {
    return db.myArchives.where('[uid+pubTime]').between([uid, Dexie.minKey], [uid, Dexie.maxKey]).reverse().toArray()
  }

  /**
   * 根据 uid 删除全部合集。
   */
  async deleteByUid(uid: number): Promise<void> {
    await db.myArchives.where('[uid+pubTime]').between([uid, Dexie.minKey], [uid, Dexie.maxKey]).delete()
  }

  /**
   * 删除全部
   */
  async deleteAll(): Promise<void> {
    await db.myArchives.clear()
  }

  /**
   * 根据 uid 和 aid 数组查询合集。
   *
   * 返回结果按 pubTime 降序排列。
   */
  async findByUidAndAids(uid: number, aids: number[]): Promise<MyArchive[]> {
    if (aids.length === 0) {
      return []
    }

    const keys = aids.map((aid) => [uid, aid] as [number, number])

    const result = await db.myArchives.where('[uid+aid]').anyOf(keys).toArray()

    return result.sort((a, b) => b.pubTime - a.pubTime)
  }

  /**
   * 根据 uid 和 aid 数组删除合集。
   */
  async deleteByUidAndAids(uid: number, aids: number[]): Promise<void> {
    if (aids.length === 0) {
      return
    }

    const keys = aids.map((aid) => [uid, aid] as [number, number])

    await db.myArchives.where('[uid+aid]').anyOf(keys).delete()
  }

  /**
   * 新增或更新合集。
   *
   * uid + aid 存在：更新
   * uid + aid 不存在：新增
   */
  async put(data: MyArchive): Promise<void> {
    await db.myArchives.put(data)
  }

  /**
   * 批量新增或更新合集。
   *
   * uid + aid 存在：更新
   * uid + aid 不存在：新增
   */
  async bulkPut(list: MyArchive[]): Promise<void> {
    if (list.length === 0) {
      return
    }

    for (const chunkList of chunk(list, 1000)) {
      await db.myArchives.bulkPut(chunkList)
    }
  }
}

export const myArchivesRepo = new MyArchivesRepo()
