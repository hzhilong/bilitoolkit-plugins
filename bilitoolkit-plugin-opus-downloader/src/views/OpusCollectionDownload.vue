<script setup lang="ts">
import DownloadView from '@/components/DownloadView.vue'
import type { OptContext } from '@/types/context'
import { parseUID, type OpusDetail, type OpusCollection } from '@ybgnb/bili-api'
import { loadingDialog, showVirtualSelectDialog, showConfirm } from 'bilitoolkit-ui'
import { sleepRandom, shortenText } from '@ybgnb/utils'
import { AppError } from 'bilitoolkit-types'

const fetchOpusList = async (context: OptContext, url: string): Promise<OpusDetail[]> => {
  const uid = await parseUID(url)
  const { client, signal } = context

  const opusCollections = await client.spaceOpus.getOpusCollections(
    {
      mid: uid,
    },
    { signal },
  )
  loadingDialog.close()
  const selectedCollectionList = await showVirtualSelectDialog({
    title: '请选择需要下载的专栏文集',
    options: opusCollections.lists,
    getDataLabel: (data: OpusCollection) => `${data.name}  （${data.articles_count}）`,
    idKey: 'id',
    multiple: true,
    canSelectAll: true,
    itemWidth: 700,
  })

  if (!selectedCollectionList || !selectedCollectionList.length) {
    throw new AppError('未选择专栏文集')
  }

  const total = selectedCollectionList.reduce((acc, cur) => acc + cur.articles_count, 0)
  await showConfirm(`确认下载所选的${total}篇专栏吗？`)

  const result: OpusDetail[] = []
  for (let i = 0; i < selectedCollectionList.length; i++) {
    const opusCollection = selectedCollectionList[i]
    loadingDialog.show(
      `${i + 1}/${selectedCollectionList.length} 正在解析文集[${shortenText(opusCollection.name, 20)}]`,
    )

    const collDetail = await client.spaceOpus.getOpusCollectionDetail(opusCollection.id, { signal: signal })
    await sleepRandom(1234, 2345)

    for (let j = 0; j < collDetail.articles.length; j++) {
      const opus = collDetail.articles[j]

      loadingDialog.show(`${j + 1}/${collDetail.articles.length} 正在解析专栏[${shortenText(opus.title, 20)}]`)
      result.push(
        await client.opus.getDetail(
          {
            id: String(opus.dyn_id_str),
          },
          { signal },
        ),
      )
      await sleepRandom(1234, 2345)
    }
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
