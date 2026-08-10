import { cloneDeep } from 'lodash-es'
import type { TaskPluginToolkitApi } from 'bilitoolkit-types'
import type { FavSyncState } from '../types/index.js'

const dbName = 'fav-sync-state'
const defaultData: FavSyncState = {
  queryParamsMap: {},
  downloadAidsMap: {},
}
const favSyncState: FavSyncState = defaultData
let toolkitApi: TaskPluginToolkitApi | null = null

const init = async (api: TaskPluginToolkitApi) => {
  toolkitApi = api
  const dbConfig = (await api.db.init(dbName, defaultData)) as FavSyncState
  Object.assign(favSyncState, dbConfig)
}

const set = async (mlid: number, page: number, favtime: number, ctime: number, avids: number[]) => {
  favSyncState.queryParamsMap[mlid] = [page, favtime, ctime]
  const allAvids = favSyncState.downloadAidsMap[mlid] ?? []
  for (const avid of avids) {
    allAvids.push(avid)
  }
  favSyncState.downloadAidsMap[mlid] = allAvids
  toolkitApi?.db.write(dbName, cloneDeep(favSyncState)).then()
}

const getQueryParams = async (mlid: number): Promise<[number, number, number] | [undefined, undefined, undefined]> => {
  if (!favSyncState.queryParamsMap[mlid]) return [undefined, undefined, undefined]

  const [page, favtime, ctime] = favSyncState.queryParamsMap[mlid]

  if (page && favtime && ctime) {
    return [page, favtime, ctime]
  }
  return [undefined, undefined, undefined]
}

const getDownloadAids = async (mlid: number): Promise<number[]> => {
  return favSyncState.downloadAidsMap[mlid] ?? []
}

const lastFavQueryRepo = {
  init,
  set,
  getQueryParams,
  getDownloadAids,
}

export { lastFavQueryRepo }
