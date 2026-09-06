<script setup lang="ts">
import { parseOpusId, type OpusDetail } from '../../../../../bili-api'
import DownloadView from '@/components/DownloadView.vue'
import type { OptContext } from '@/types/context'
import { sleepRandom } from '@ybgnb/utils'

const fetchOpusList = async (context: OptContext, url: string): Promise<OpusDetail[]> => {
  const opusId = await parseOpusId(url)
  const { client, signal } = context
  const opus = await client.opus.getDetail(
    {
      id: opusId,
    },
    { signal },
  )
  await sleepRandom(1122, 2555, signal)
  return [opus]
}
</script>

<template>
  <DownloadView placeholder="请输入专栏链接 / b23分享链接" :fetch-opus-list="fetchOpusList" :autoOpenFolder="true" />
</template>

<style scoped lang="scss"></style>
