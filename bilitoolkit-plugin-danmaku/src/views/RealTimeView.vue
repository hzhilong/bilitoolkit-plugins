<script setup lang="ts">
import DanmakuSearchPage from '@/components/DanmakuSearchPage.vue'
import { publicClient } from 'bilitoolkit-runtime/biliapi'
import type { VideoPart, DanmakuElem } from '@ybgnb/bili-api'

const fetchDM = async ({ cid, duration }: VideoPart): Promise<DanmakuElem[]> => {
  return await publicClient.dm.fetchAll({ cid, duration })
}
</script>

<template>
  <DanmakuSearchPage
    :fetchDM="fetchDM"
    alert="实时弹幕池容量有限，占满后会使实时弹幕池底部的弹幕压入历史弹幕池"
  ></DanmakuSearchPage>
</template>

<style scoped lang="scss"></style>
