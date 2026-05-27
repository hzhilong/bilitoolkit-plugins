import Dexie, { type EntityTable } from 'dexie'
import { appEnv } from '@ybgnb/vite-env/common'
import type { Task } from '@/core/types/task'
import type { TaskGroup } from '@/core/types/task-group'
import type { TaskLog } from '@/core/types/log'

const db = new Dexie(appEnv.APP_NPM_NAME) as Dexie & {
  task: EntityTable<Task, 'id'>
  taskLog: EntityTable<TaskLog, 'id'>
  taskGroup: EntityTable<TaskGroup, 'id'>
}

db.version(3).stores({
  task: '++id, operationType, dataType, status, createdAt',
  taskLog: '++id,  [taskId+id],  taskId',
  taskGroup:
    '++id, operationType, status, createdAt, [status+createdAt], [operationType+createdAt], [status+operationType+createdAt]',
})

export { db }
