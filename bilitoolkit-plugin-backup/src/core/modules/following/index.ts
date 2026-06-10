import { TreeDataModule } from '@/core/modules/tree-data-module'
import { type DataType, DataTypeMap } from '@/core/types/data-type'
import type { ExportTarget, BackupDataRangeType } from '@/core/types/backup'
import type { OperationType } from '@/core/types/operation'
import type { FetchPageParams } from '@/core/types/data-module'
import type { ExecuteContext } from '@/core/types/execute'
import { publicClient } from 'bilitoolkit-runtime/biliapi'
import { type FollowTag, type Following, toFollowTags, toFollowing } from '@/core/modules/following/types'
import type { TreeRangeMetas } from '@/core/types/data-range'
import type { PageDataWithNextParams } from '@ybgnb/bili-api'
import { apiSleep } from '@/core/utils/sleep'
import { getErrorMessage } from '@ybgnb/utils'

export class FollowingModule extends TreeDataModule<Following, FollowTag> {
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
    return `关注分组-${data.name}`
  }

  getChildrenDataTitle(child: Following): string {
    return `关注用户-${child.uname}`
  }

  private async getFollowTags({ client, signal }: ExecuteContext) {
    return toFollowTags(await client.relation.getFollowTags({ signal }))
  }

  async fetchTotal(context: ExecuteContext): Promise<number> {
    const tags = await this.getFollowTags(context)
    return tags.length ?? 0
  }

  async fetchChildrenTotal(context: ExecuteContext, tag: FollowTag): Promise<number> {
    return tag.count
  }

  async fetchChildrenPage(
    { client, signal }: ExecuteContext,
    params: FetchPageParams,
    tag: FollowTag,
  ): Promise<PageDataWithNextParams<Following>> {
    const result = await client.relation.fetchRelationPageWithNextParams(Number(tag._id), params, {
      signal,
    })
    return {
      ...result,
      items: result.items ? toFollowing(result.items) : [],
    }
  }

  fetchParentAll(context: ExecuteContext): Promise<FollowTag[]> {
    context.onProgress?.(undefined, `正在获取关注分组`)
    return this.getFollowTags(context)
  }

  async restoreData({ client, signal }: ExecuteContext, tag: FollowTag): Promise<string> {
    const id = await client.relation.createFollowTag(tag.name, { signal })
    return String(id.tagid)
  }

  async restoreChildrenData(
    { client, appSettings, onProgress, signal }: ExecuteContext,
    following: Following,
    parentIds: string[],
  ): Promise<void> {
    if (appSettings.avoidRiskControl) {
      await onProgress?.(undefined, '避免风控中...')
      await client.relation.avoidRiskControl(following.mid, { signal })
      await apiSleep(signal)
    }
    await onProgress?.(undefined, `正在关注用户 [${following.uname}]`)
    try {
      await client.relation.followUser(following.mid, { signal })
    } catch (e) {
      if (!getErrorMessage(e).includes('已经关注') && !getErrorMessage(e).includes('已注销')) {
        throw e
      }
    }
    await apiSleep(signal)
    if (parentIds.length !== 1 || parentIds[0] !== '0') {
      // 非默认分组
      await onProgress?.(undefined, `正在给用户分组 [${following.uname}]`)
      await client.relation.copyUsersToTag([following.mid], parentIds.map(Number))
    }
  }

  async delParentData({ client, signal }: ExecuteContext, tag: FollowTag): Promise<void> {
    await client.relation.deleteFollowTag(tag.tagid, { signal })
  }

  async delChildData({ client, signal }: ExecuteContext, user: Following): Promise<void> {
    await client.relation.unFollowUser(user.mid, { signal })
  }
}
