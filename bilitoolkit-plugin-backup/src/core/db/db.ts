import Dexie, { type EntityTable } from 'dexie'
import type { Task } from '@/core/task/task'
import { appEnv } from '@ybgnb/vite-env/common'

const db = new Dexie(appEnv.APP_NPM_NAME) as Dexie & {
  task: EntityTable<Task, 'id'>
}

db.version(1).stores({
  task: '++id, operationType, dataType, status, createdAt',
})

export { db }
