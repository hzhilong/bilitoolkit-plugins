import { cloneDeep } from 'lodash-es'
import type { LastQueryTime } from '../types/index.js'
import type { TaskPluginToolkitApi } from 'bilitoolkit-types'

const dbName = 'dynamic-archive-exec-data'
const defaultData: LastQueryTime = {}
const lastQueryTime: LastQueryTime = defaultData
let toolkitApi: TaskPluginToolkitApi | null = null

const init = async (api: TaskPluginToolkitApi) => {
  toolkitApi = api
  const dbConfig = (await api.db.init(dbName, defaultData)) as LastQueryTime
  Object.assign(lastQueryTime, dbConfig)
}

const set = async (mid: number, time: number) => {
  lastQueryTime[mid] = time
  toolkitApi?.db.write(dbName, cloneDeep(lastQueryTime)).then()
}

const get = async (mid: number): Promise<number | undefined> => {
  return lastQueryTime[mid]
}

const lastQueryTimeRepo = {
  init,
  set,
  get,
}

export { lastQueryTimeRepo }
