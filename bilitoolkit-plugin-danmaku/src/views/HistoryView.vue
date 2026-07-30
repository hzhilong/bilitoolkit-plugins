<script setup lang="ts">
import DanmakuSearchPage from '@/components/DanmakuSearchPage.vue'
import { publicClient } from 'bilitoolkit-runtime/biliapi'
import type { VideoPart, DanmakuElem, VideoInfo } from '@ybgnb/bili-api'
import { ref } from 'vue'
import QueryFormItem from '@/components/QueryFormItem.vue'
import { loadingDialog } from 'bilitoolkit-ui'
import { getMonthRangeStr } from '@/utils/date'
import { sleepRandom, createAbortError } from '@ybgnb/utils'

const currMonthStart = new Date()
currMonthStart.setDate(1)
currMonthStart.setHours(0, 0, 0, 0)

const currMonthEnd = new Date()
currMonthEnd.setMonth(currMonthEnd.getMonth() + 1, 0)
currMonthEnd.setHours(23, 59, 59, 999)

const monthRange = ref<Date[]>([currMonthStart, currMonthEnd])
const defaultTime = ref<[Date, Date]>([new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 2, 1, 23, 59, 59)])

const isDisabledData = (date: Date, videoInfo: VideoInfo) => {
  const pubData = videoInfo.pubdate ?? 0
  return date.getTime() > currMonthEnd.getTime() || date.getTime() < pubData * 1000
}

const fetchDM = async ({ cid }: VideoPart): Promise<DanmakuElem[]> => {
  try {
    const abortController = new AbortController()
    const signal = abortController.signal
    const checkAbort = () => {
      if (signal?.aborted) throw createAbortError()
    }
    const onCancel = () => abortController.abort()
    const showLoading = (msg: string) => {
      loadingDialog.show({
        message: msg,
        showCancel: true,
        onCancel,
      })
    }
    showLoading('加载中')
    const months = getMonthRangeStr(monthRange.value![0], monthRange.value![1])

    const allItems: DanmakuElem[] = []
    for (let i = 0; i < months.length; i++) {
      checkAbort()
      const month = months[i]
      const days = await publicClient.dm.getHistoryIndex(
        {
          cid: cid,
          month,
        },
        { signal },
      )

      checkAbort()
      if (days.length > 0) {
        showLoading(`[${month}] 存在 ${days.length} 天的历史弹幕`)
      } else {
        showLoading(`[${month}] 不存在历史弹幕`)
      }
      await sleepRandom(1111, 2233, signal)

      for (const day of days) {
        checkAbort()
        const dmList = await publicClient.dm.getHistory(
          {
            cid,
            date: day,
          },
          { signal },
        )
        allItems.push(...dmList)
        checkAbort()
        showLoading(`[${day}] 存在 ${dmList.length} 条历史弹幕`)
        await sleepRandom(1111, 2233, signal)
      }
    }
    return allItems
  } finally {
    loadingDialog.close()
  }
}
</script>

<template>
  <DanmakuSearchPage :fetchDM="fetchDM">
    <template #dm-query-form="{ videoInfo }">
      <QueryFormItem prefix="日期范围">
        <el-date-picker
          v-model="monthRange"
          type="monthrange"
          start-placeholder=""
          end-placeholder=""
          :disabledDate="(date: Date) => isDisabledData(date, videoInfo)"
          :clearable="false"
          :default-time="defaultTime"
        />
      </QueryFormItem>
    </template>
  </DanmakuSearchPage>
</template>

<style scoped lang="scss"></style>
