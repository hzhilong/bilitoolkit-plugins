import { db } from '@/db/db'
import type { PollRecord } from '@/types'
import type { PageParams, PageResult } from 'bilitoolkit-ui'

export class PollRecordRepo {
  async save(record: Omit<PollRecord, 'id'>): Promise<void> {
    await db.pollRecord.put(record)
  }

  async delete(id: number): Promise<void> {
    await db.pollRecord.delete(id)
  }

  async deleteAll(): Promise<void> {
    await db.pollRecord.clear()
  }

  async findById(id: number): Promise<PollRecord | undefined> {
    return db.pollRecord.get(id)
  }

  async getPageList(pageParams: PageParams) {
    const { pageNum, pageSize } = pageParams
    const total = await db.pollRecord.count()
    const data = await db.pollRecord
      .orderBy('id')
      .reverse()
      .offset((pageNum - 1) * pageSize)
      .limit(pageSize)
      .toArray()

    return {
      data: data,
      pageNum: pageNum,
      pageSize: pageSize,
      totalPages: Math.ceil(total / pageSize),
      total: total,
    } satisfies PageResult<PollRecord>
  }
}

export const pollRecordRepo = new PollRecordRepo()
