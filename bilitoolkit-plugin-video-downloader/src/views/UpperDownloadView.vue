<script setup lang="ts">
import { AppError } from 'bilitoolkit-types'
import { createBiliClient, publicClient } from 'bilitoolkit-runtime/biliapi'
import { parseUID, type VideoInfo } from '@ybgnb/bili-api'
import DownloadView from '@/components/video/DownloadView.vue'
import type { DownloadVideoData } from '@/types/download'
import { ref } from 'vue'
import { loadingDialog, useSelectedUserStore, showError, showPageRangeDialog } from 'bilitoolkit-ui'
import { storeToRefs } from 'pinia'
import { sleepRandom, getErrorMessage, sleep, createAbortError, getFormattedDateTime } from '@ybgnb/utils'
import { getDataByPageRange } from '@/utils/page'

const { user } = storeToRefs(useSelectedUserStore())
const title = ref<string>('')

const fetchVideos = async (url: string) => {
  try {
    const uid = await parseUID(url)
    const client = await createBiliClient(user.value!)
    const abortController = new AbortController()
    const signal = abortController.signal
    const onCancel = () => abortController.abort()

    const loading = (msg: string) => {
      loadingDialog.show({
        message: msg,
        showCancel: true,
        onCancel,
      })
    }

    loading('正在获取该用户的投稿数')
    const userCards = await client.user.getUserCards([uid], { signal })
    await sleep(600)
    const { video: videoCount } = await client.spaceStatus.getNavNum(uid, { signal })
    loading(`该用户的投稿数：${videoCount}`)
    await sleep(1000)
    if (!videoCount) throw new AppError(`该用户的投稿视频为空`)

    const pageSize = publicClient.spaceVideo.buildPager({ mid: uid }).getPageSize()

    loadingDialog.close()
    const pageRange = await showPageRangeDialog({
      pageSize: pageSize,
      total: videoCount,
    })

    if (!pageRange) throw createAbortError()

    loading(`正在获取投稿列表 [${uid}] [${pageRange}]`)

    title.value = `【${userCards?.[0]?.name ?? uid}】批量下载 [${pageRange[0]} - ${pageRange[1]}]`

    const list = await getDataByPageRange(
      {
        onProgress: async (_, msg) => {
          if (msg) loading(msg)
        },
        signal: signal,
      },
      {
        ranges: pageRange,
      },
      async (pageNum, pageParams) => {
        return await client.spaceVideo.fetchPageWithNextParams(
          {
            mid: uid,
          },
          {
            pageNum: pageNum,
            pageParams: pageParams,
          },
          { signal },
        )
      },
    )

    if (!list || list.length === 0) {
      throw new AppError('`数据为空`')
    }

    const videos: VideoInfo[] = []
    for (let i = 0; i < list.length; i++) {
      const spaceVideo = list[i]
      loading(`[${i + 1}/${list.length}] 正在获取视频...`)
      try {
        const videoInfo = await client.videoInfo.getInfo({ aid: spaceVideo.aid }, { signal })
        videos.push(videoInfo)
      } catch (err) {
        showError(`【${spaceVideo.title}】：${getErrorMessage(err)}`)
      }
      if (i < list.length - 1) {
        await sleepRandom(1111, 2233, signal)
      }
    }

    if (videos.length === 0) {
      throw new AppError('`所选内容为空`')
    }
    return videos
  } finally {
    loadingDialog.close()
  }
}

const getTitle = (_list: DownloadVideoData[]) => {
  return title.value ?? `${getFormattedDateTime()}`
}
</script>

<template>
  <DownloadView
    placeholder="请输入用户链接 / b23分享链接 / 用户UID"
    :fetchVideos="fetchVideos"
    :getTitle="getTitle"
  ></DownloadView>
</template>

<style scoped lang="scss"></style>
