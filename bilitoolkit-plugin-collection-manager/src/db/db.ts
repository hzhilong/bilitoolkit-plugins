import Dexie, { type EntityTable } from 'dexie'
import type { MyArchive, CacheState } from '@/types'

const db = new Dexie('collection-manager') as Dexie & {
  myArchives: EntityTable<MyArchive, 'aid'>
  cacheState: EntityTable<CacheState, 'uid'>
}

db.version(1).stores({
  myArchives: 'aid, [uid+aid], [uid+pubTime]',
  cacheState: 'uid',
})
export { db }
