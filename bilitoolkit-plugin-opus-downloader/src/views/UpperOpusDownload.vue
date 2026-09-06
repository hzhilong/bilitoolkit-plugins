<script setup lang="ts">
import DownloadView from '@/components/DownloadView.vue'
import type { OptContext } from '@/types/context'
import { parseUID, type SpaceOpus, type OpusDetail } from '@ybgnb/bili-api'
import { loadingDialog, showVirtualSelectDialog, showConfirm } from 'bilitoolkit-ui'
import { isCanceledError, sleepRandom, shortenText } from '@ybgnb/utils'
import { AppError } from 'bilitoolkit-types'

const fetchOpusList = async (context: OptContext, url: string): Promise<OpusDetail[]> => {
  const uid = await parseUID(url)
  const { client, signal } = context

  const list: SpaceOpus[] = []
  try {
    await client.spaceOpus.fetchAll(
      {
        host_mid: uid,
        type: 'article',
      },
      undefined,
      async (currList) => {
        list.push(...currList)
      },
      { signal },
    )
  } catch (e) {
    if (!isCanceledError(e) || list.length === 0) {
      throw e
    }
  }
  loadingDialog.close()
  const selectedList = await showVirtualSelectDialog({
    title: '请选择需要下载的专栏',
    options: list,
    getDataLabel: (data: SpaceOpus) => data.content,
    idKey: 'opus_id',
    multiple: true,
    canSelectAll: true,
    itemWidth: 700,
  })

  if (!selectedList || !selectedList.length) {
    throw new AppError('未选择专栏')
  }

  await showConfirm(`确认下载所选的${selectedList.length}篇专栏吗？`)

  const result: OpusDetail[] = []
  for (let i = 0; i < selectedList.length; i++) {
    const opus = selectedList[i]
    loadingDialog.show(`${i + 1}/${selectedList.length} 正在解析[${shortenText(opus.content, 20)}]`)
    result.push(
      await client.opus.getDetail(
        {
          id: opus.opus_id,
        },
        { signal },
      ),
    )
    await sleepRandom(1234, 2345)
  }

  return result
}
</script>

<template>
  <DownloadView
    placeholder="请输入用户链接 / b23分享链接 / 用户UID"
    :fetch-opus-list="fetchOpusList"
    :autoOpenFolder="true"
  />
</template>

<style scoped lang="scss"></style>
