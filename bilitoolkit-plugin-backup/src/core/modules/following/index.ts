import { type DataType, DataTypeMap } from '@/core/types/data-type'
import type { ExportTarget, BackupDataRangeType } from '@/core/types/backup'
import type { OperationType } from '@/core/types/operation'
import type { FetchPageParams } from '@/core/types/data-module'
import type { ExecuteContext } from '@/core/types/execute'
import { toolkitApi } from 'bilitoolkit-ui'
import { biliApi } from 'bilitoolkit-runtime/biliapi'
import type { BatchableModule } from '@/core/types/batch'
import { publicClient, invokeBiliApi } from '@/core/commom/client'
import { type FollowTag, type Following, toFollowTags } from '@/core/modules/following/types'
import type { TreeRangeOptions } from '@/core/types/data-range'
import type { PageDataWithNextParams } from '@ybgnb/bili-api'
import { BaseTreeModule } from '@/core/modules/base-tree-module'

export class FollowingModule extends BaseTreeModule<FollowTag, Following> implements BatchableModule {
  dataType: DataType = 'follower'
  dataTypeName: string = DataTypeMap[this.dataType].name
  operations: OperationType[] = ['backup', 'restore', 'clear']
  backupDataRangeTypes: BackupDataRangeType[] = ['all', 'tree']
  exportTargets: ExportTarget[] = ['json']
  treeRangeOptions = [
    {
      name: '关注分组',
      multipleSelectable: true,
    },
    { name: '关注UP' },
  ] as TreeRangeOptions<FollowTag | Following>
  batchSizes = [30, 50, 100, 200, 400]

  getPageSize = () => {
    return publicClient.relation.buildFollowingsPager().getPageSize()
  }

  getDataTotalDesc(list: FollowTag[]): string {
    return `${list.length} 关注分组 · ${list.reduce((t, i) => t + (i.list?.length ?? 0), 0)} 关注用户`
  }

  getParentNodeTitle = (parent: FollowTag) => {
    return `关注分组 [${parent.name}]`
  }

  private async getFollowTags(clientId: string) {
    return toFollowTags(await invokeBiliApi(clientId, biliApi.relation.getFollowTags))
  }

  fetchTotal = async ({ clientId }: ExecuteContext): Promise<number> => {
    const tags = await this.getFollowTags(clientId)
    return tags.length ?? 0
  }

  fetchChildrenTotal = async (context: ExecuteContext, tag: FollowTag): Promise<number> => {
    return tag.count
  }

  fetchPage = async (
    { clientId }: ExecuteContext,
    _params: FetchPageParams,
  ): Promise<PageDataWithNextParams<FollowTag>> => {
    const tags = await this.getFollowTags(clientId)
    return {
      items: tags as FollowTag[],
      nextParams: {},
      hasNext: false,
      pageSize: tags.length,
    }
  }

  fetchChildrenPage = async (
    { clientId }: ExecuteContext,
    params: FetchPageParams,
    tag: FollowTag,
  ): Promise<PageDataWithNextParams<Following>> => {
    return toolkitApi.bili.invokeBiliApi(clientId, biliApi.relation.fetchRelationPageWithNextParams, tag.tagid, params)
  }

  fetchAll = (context: ExecuteContext): Promise<FollowTag[]> => {
    context.onProgress?.(undefined, `正在获取关注分组`)
    return this.getFollowTags(context.clientId)
  }

  fetchAllByIds = async (context: ExecuteContext, ids: string[]) => {
    context.onProgress?.(undefined, `正在获取关注分组`)
    const list = await this.getFollowTags(context.clientId)
    return list.filter((item) => ids.includes(String(item.tagid)))
  }

  fetchChildrenAll = (context: ExecuteContext, tag: FollowTag): Promise<Following[]> => {
    return this.baseFetchChildrenAll(context, tag)
  }
}
