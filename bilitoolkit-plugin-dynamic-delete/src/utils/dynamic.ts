import type { Dynamic, RichTextNode, BiliClient, OnPageFetched } from '@ybgnb/bili-api'
import { AppError } from 'bilitoolkit-types'
import { showVirtualSelectDialog, showConfirm } from 'bilitoolkit-ui'
import { getErrorMessage, sleepRandom, createAbortError, shortenText } from '@ybgnb/utils'

export function isLotteryDynamic(dynamic: Dynamic) {
  const forwardDynamic = dynamic.orig
  if (!forwardDynamic) return false

  const nodes: RichTextNode[] = forwardDynamic.modules.module_dynamic.major?.opus?.summary.rich_text_nodes ?? []

  for (const node of nodes) {
    if (node.type === 'RICH_TEXT_NODE_TYPE_LOTTERY') {
      return true
    }
  }
  return false
}

export async function fetchDynamics(
  {
    client,
    addLog,
    signal,
    currUid,
  }: { client: BiliClient; addLog: (message: string) => void; signal?: AbortSignal; currUid: number },
  filter: (dynamic: Dynamic) => boolean,
) {
  const bizOptions = {
    signal: signal,
  }
  const filteredList: Dynamic[] = []
  addLog(`正在获取动态`)
  const onPageFetched: OnPageFetched<Dynamic> = async (currList: Dynamic[], _list: Dynamic[]) => {
    if (currList == null || currList.length === 0) return false

    addLog(`已获取 ${currList.length} 条动态`)
    for (const dynamic of currList) {
      if (bizOptions.signal?.aborted) throw createAbortError()

      if (filter(dynamic)) {
        filteredList.push(dynamic)
      }
    }
    return true
  }
  await client.spaceDynamic.fetchAll({ host_mid: currUid }, undefined, onPageFetched, bizOptions)

  if (bizOptions.signal?.aborted) throw createAbortError()
  if (filteredList.length > 0) {
    addLog(`已找到 ${filteredList.length} 条符合条件的动态`)
    return filteredList
  } else {
    throw new AppError(`未找到符合条件的动态`)
  }
}

export async function deleteDynamics(
  {
    client,
    addLog,
    signal,
  }: {
    client: BiliClient
    addLog: (message: string) => void
    signal?: AbortSignal
    currUid: number
  },
  list: Dynamic[],
  getDataLabel: (dynamic: Dynamic) => string,
  itemWidth: number,
) {
  const deleteList = await showVirtualSelectDialog<Dynamic, 'id_str'>({
    title: '请选择要删除的动态',
    options: list,
    defaultSelectedIds: [],
    getDataLabel: getDataLabel,
    idKey: 'id_str',
    multiple: true,
    canSelectAll: true,
    itemHeight: 28,
    itemWidth: itemWidth,
  })

  if (!deleteList || deleteList.length === 0) {
    return
  }
  if (signal?.aborted) throw createAbortError()

  await showConfirm(`确定删除所选的${deleteList.length}条动态吗？`)
  await showConfirm('确定清空吗')

  let successCount = 0

  for (let i = 0; i < deleteList.length; i++) {
    const dynamic = deleteList[i]
    try {
      await client.spaceDynamic.deleteDynamic(dynamic.id_str, { signal })
    } catch (e) {
      addLog(`删除动态失败 ${getErrorMessage(e)}：【${shortenText(getDataLabel(dynamic), 30)}】`)
      throw e
    }
    successCount++
    addLog(`成功删除动态：【${shortenText(getDataLabel(dynamic), 30)}】`)
    if (signal?.aborted) throw createAbortError()

    if (i !== deleteList.length - 1) {
      await sleepRandom(1122, 2233)
    }
  }
  addLog(`成功删除${successCount}条动态`)
}

export async function deleteFilterDynamics(
  context: { client: BiliClient; addLog: (message: string) => void; signal?: AbortSignal; currUid: number },
  filter: (dynamic: Dynamic) => boolean,
  getDataLabel: (dynamic: Dynamic) => string,
  itemWidth: number,
) {
  const list = await fetchDynamics(context, filter)

  if (!list || list.length === 0) return

  await deleteDynamics(context, list, getDataLabel, itemWidth)
}
