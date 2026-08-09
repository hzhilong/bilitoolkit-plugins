import Dexie, { type EntityTable } from 'dexie'
import type { PollRecord } from '@/types'

const db = new Dexie('comment-export') as Dexie & {
  pollRecord: EntityTable<PollRecord, 'id'>
}

db.version(1).stores({
  pollRecord: '++id,createdAt',
})

export { db }
