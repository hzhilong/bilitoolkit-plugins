import { TreeDataModule } from '@/core/modules/tree-data-module'
import { type DataType, DataTypeMap } from '@/core/types/data-type'
import type { ExportTarget, BackupDataRangeType } from '@/core/types/backup'
import type { OperationType } from '@/core/types/operation'
import type { FetchPageParams } from '@/core/types/data-module'
import type { ExecuteContext } from '@/core/types/execute'
import { biliApi, invokeBiliApi, publicClient } from 'bilitoolkit-runtime/biliapi'
import { type FollowTag, type Following, toFollowTags } from '@/core/modules/following/types'
import type { TreeRangeMetas } from '@/core/types/data-range'
import type { PageDataWithNextParams } from '@ybgnb/bili-api'

export class FollowingModule extends TreeDataModule<FollowTag, Following> {
  dataType: DataType = 'following'
  dataTypeName: string = DataTypeMap[this.dataType].name
  operations: OperationType[] = ['backup', 'restore', 'clear']
  backupDataRangeTypes: BackupDataRangeType[] = ['all', 'tree']
  childrenRangeOptions: ('all' | 'page')[] = ['all', 'page']
  exportTargets: ExportTarget[] = ['json']
  treeRangeMetas: TreeRangeMetas = [
    {
      name: '关注分组',
      multipleSelectable: true,
    },
    { name: '关注UP' },
  ] as TreeRangeMetas

  getPageSize() {
    return publicClient.relation.buildRelationPager(1).getPageSize()
  }

  getDataTotalDesc(list: FollowTag[]): string {
    return `${list.length} 关注分组 · ${list.reduce((t, i) => t + (i.childrenSize ?? 0), 0)} 关注用户`
  }

  getDataTitle(data: FollowTag): string {
    return `关注分组: ${data.name}`
  }

  getChildrenDataTitle(child: Following): string {
    return `关注用户: ${child.name}`
  }

  private async getFollowTags({ clientId, signal }: ExecuteContext) {
    return toFollowTags(await invokeBiliApi(clientId, biliApi.relation.getFollowTags, { signal }))
  }

  async fetchTotal(context: ExecuteContext): Promise<number> {
    const tags = await this.getFollowTags(context)
    return tags.length ?? 0
  }

  async fetchChildrenTotal(context: ExecuteContext, tag: FollowTag): Promise<number> {
    return tag.count
  }

  async fetchChildrenPage(
    { clientId, signal }: ExecuteContext,
    params: FetchPageParams,
    tag: FollowTag,
  ): Promise<PageDataWithNextParams<Following>> {
    return invokeBiliApi(clientId, biliApi.relation.fetchRelationPageWithNextParams, tag.tagid, params, { signal })
  }

  fetchAll(context: ExecuteContext): Promise<FollowTag[]> {
    context.onProgress?.(undefined, `正在获取关注分组`)
    return this.getFollowTags(context)
  }

  async fetchAllByIds(context: ExecuteContext, ids: string[]) {
    context.onProgress?.(undefined, `正在获取关注分组`)
    const list = await this.getFollowTags(context)
    return list.filter((item) => ids.includes(String(item.tagid)))
  }

  fetchChildrenAll(context: ExecuteContext, tag: FollowTag): Promise<Following[]> {
    return this.baseFetchChildrenAll(context, tag)
  }

  restoreData(_context: ExecuteContext, _data: FollowTag): Promise<void> {
    // TODO 还原关注前，查看空间、信息等操作的防风控->可配置
    throw new Error('Method not implemented.')
  }

  restoreChildrenData(_context: ExecuteContext, _children: Following): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
