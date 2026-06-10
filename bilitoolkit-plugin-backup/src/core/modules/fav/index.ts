import { TreeDataModule } from '@/core/modules/tree-data-module'
import { type DataType, DataTypeMap } from '@/core/types/data-type'
import type { ExportTarget, BackupDataRangeType } from '@/core/types/backup'
import type { OperationType } from '@/core/types/operation'
import type { FetchPageParams, FetchAllMode } from '@/core/types/data-module'
import type { ExecuteContext } from '@/core/types/execute'
import { publicClient } from 'bilitoolkit-runtime/biliapi'
import type { TreeRangeMetas } from '@/core/types/data-range'
import { type PageDataWithNextParams, type FavFolderMeta, getFavFolderType } from '@ybgnb/bili-api'
import { type FavFolder, type FavItem, toVideoFavFolders, toVideoFavItems } from '@/core/modules/fav/types'
import { sleepRandom, chunk, inArray } from '@ybgnb/utils'
import { apiSleep } from '@/core/utils/sleep'

export class FavModule extends TreeDataModule<FavItem, FavFolder> {
  dataType: DataType = 'favorites'
  dataTypeName: string = DataTypeMap[this.dataType].name
  operations: OperationType[] = ['backup', 'restore', 'clear']
  backupDataRangeTypes: BackupDataRangeType[] = ['all', 'tree']
  childrenRangeOptions: ('all' | 'page')[] = ['all', 'page']
  exportTargets: ExportTarget[] = ['json']
  treeRangeMetas: TreeRangeMetas = [
    {
      name: '收藏夹',
      multipleSelectable: true,
    },
    { name: '收藏视频' },
  ] as TreeRangeMetas
  supportsOneClickClear: boolean = true

  getPageSize() {
    return publicClient.fav.buildPager({ media_id: 1 }).getPageSize()
  }

  getDataTotalDesc(list: FavFolder[]): string {
    return `${list.length} 收藏夹 · ${list.reduce((t, i) => t + (i.childrenSize ?? 0), 0)} 视频`
  }

  getDataTitle(data: FavFolder): string {
    return `收藏夹-${data.title}`
  }

  getChildrenDataTitle(child: FavItem): string {
    return `视频-${child.title}`
  }

  private async getFavFolders({ client, signal, onProgress }: ExecuteContext, mode?: FetchAllMode) {
    const { list } = await client.fav.getFavFolders(undefined, undefined, { signal })
    if (!mode || mode === 'tree-select') {
      return toVideoFavFolders(list as FavFolder[])
    }
    const metas: FavFolderMeta[] = []
    const total = list.length
    await sleepRandom(300, 500)
    for (let i = 0; i < total; i++) {
      const folder = list[i]
      await onProgress?.((i * 100) / total, `[${i + 1}/${total}] 正在获取收藏夹 [${folder.title}] 详情`)
      const result = await client.fav.getFavFolderMeta(folder.id, { signal })
      metas.push(result)
      await sleepRandom(300, 500)
    }
    return toVideoFavFolders(metas)
  }

  async fetchTotal({ client, signal }: ExecuteContext): Promise<number> {
    return (await client.fav.getFavFolders(undefined, undefined, { signal })).count ?? 0
  }

  async fetchChildrenTotal(context: ExecuteContext, folder: FavFolder): Promise<number> {
    return folder.media_count
  }

  async fetchChildrenPage(
    { client, signal }: ExecuteContext,
    params: FetchPageParams,
    folder: FavFolder,
  ): Promise<PageDataWithNextParams<FavItem>> {
    const result = await client.fav.fetchPageWithNextParams(
      {
        media_id: Number(folder._id),
      },
      params,
      {
        signal,
      },
    )
    return {
      ...result,
      items: result.items ? toVideoFavItems(result.items) : [],
    }
  }

  async fetchParentAll(context: ExecuteContext, mode?: FetchAllMode): Promise<FavFolder[]> {
    context.onProgress?.(undefined, `正在获取收藏夹`)
    return await this.getFavFolders(context, mode)
  }

  async restoreData({ client, signal }: ExecuteContext, folder: FavFolder): Promise<string> {
    const newFolder = await client.fav.addFavFolder(
      {
        title: folder.title,
        cover: folder.cover,
        intro: folder.intro,
        privacy: inArray(getFavFolderType(folder), ['default_private', 'other_private']) ? 1 : 0,
      },
      { signal },
    )
    return String(newFolder.id)
  }

  async restoreChildrenData({ client, signal }: ExecuteContext, children: FavItem, parentIds: string[]): Promise<void> {
    await client.fav.favVideo(children.id, parentIds.map(Number), [], { signal })
  }

  async delParentData(): Promise<void> {}

  async delChildData(): Promise<void> {}

  async clearData(context: ExecuteContext): Promise<string | void> {
    const { client, signal, onProgress } = context
    onProgress?.(0, `正在处理收藏夹`)
    const { list, count } = await client.fav.getFavFolders(undefined, undefined, { signal })
    await apiSleep(signal)
    const nonDefaultFolders = list.filter((f) => !inArray(getFavFolderType(f), ['default_private', 'default_public']))
    if (nonDefaultFolders.length > 0) {
      await client.fav.delFavFolder(
        nonDefaultFolders.map((f) => f.id),
        { signal },
      )
      onProgress?.(0, `成功删除 ${nonDefaultFolders.length} 个非默认收藏夹`)
      await apiSleep(signal)
    }
    const defaultFolder = list.find((f) => inArray(getFavFolderType(f), ['default_private', 'default_public']))!
    onProgress?.(0, `正在获取默认收藏夹列表`)
    const favItems = await this.baseFetchChildrenAll(context, defaultFolder as FavFolder)
    onProgress?.(0, `正在处理默认收藏夹`)
    const chunkList = chunk(favItems, 40)
    for (let i = 0; i < chunkList.length; i++) {
      const cList = chunkList[i]
      await client.fav.batchDelFavItems(defaultFolder.id, cList.map((c) => `${c.id}:${c.type}`).join(','), { signal })
      onProgress?.((i * 100) / count, `[${i + 1}/${chunkList.length}] 成功批量删除 ${cList.length} 个收藏视频`)
      await apiSleep(signal)
    }
    await client.fav.cleanFavItems(defaultFolder.id, { signal })
    onProgress?.(0, `成功清空默认收藏夹的所有失效内容`)
  }
}
