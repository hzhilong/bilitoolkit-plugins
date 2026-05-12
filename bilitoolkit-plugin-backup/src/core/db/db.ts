import Dexie, { type EntityTable } from 'dexie'
import { appEnv } from '@ybgnb/vite-env/common'
import type { Task } from '@/core/types/task'
import type { TaskGroup } from '@/core/types/task-group'

const db = new Dexie(appEnv.APP_NPM_NAME) as Dexie & {
  task: EntityTable<Task, 'id'>
  taskGroup: EntityTable<TaskGroup, 'id'>
}

db.version(1).stores({
  task: '++id, operationType, dataType, status, createdAt',
  taskGroup: '++id, operationType, status, createdAt',
})

export { db }
