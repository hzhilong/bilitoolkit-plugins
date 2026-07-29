<script setup lang="ts">
import { AppError } from 'bilitoolkit-types'
import { createBiliClient } from 'bilitoolkit-runtime/biliapi'
import { parseUID, type FavFolderItem, type VideoInfo } from '@ybgnb/bili-api'
import DownloadView from '@/components/video/DownloadView.vue'
import type { DownloadVideoData } from '@/types/download'
import { ref } from 'vue'
import { loadingDialog, useSelectedUserStore, showError, showSelectDialog } from 'bilitoolkit-ui'
import { storeToRefs } from 'pinia'
import { sleepRandom, getErrorMessage } from '@ybgnb/utils'

const folders = ref<FavFolderItem[]>([])
const { user } = storeToRefs(useSelectedUserStore())

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

    loading('正在获取收藏夹')

    const { list: folderList, count } = await client.fav.getFavFolders(uid, undefined, {
      signal: signal,
    })

    if (!count) {
      throw new AppError('`该用户未公开收藏夹`')
    }

    loadingDialog.close()

    let selectedFolders =
      (await showSelectDialog<FavFolderItem>({
        title: '请选择需要下载的收藏夹',
        options: folderList,
        getDataId: (f) => f.id,
        getDataLabel: (f) => `${f.title}  （${f.media_count}）`,
        multiple: true,
      })) ?? []

    selectedFolders = selectedFolders.filter((f) => f.media_count > 0)

    const folderCount = selectedFolders.length
    if (!selectedFolders || folderCount === 0) {
      throw new AppError('`所选的收藏夹为空`')
    }

    if (!selectedFolders.reduce((acc, folder) => acc + folder.media_count, 0)) {
      throw new AppError('`所选的收藏夹内容为空`')
    }

    folders.value = selectedFolders

    const videos: VideoInfo[] = []
    for (let i = 0; i < folderCount; i++) {
      const folder = selectedFolders[i]
      const logPrefix = folderCount > 1 ? `[${i + 1}/${folderCount}] ` : ''
      loading(`${logPrefix} 正在获取收藏夹【${folder.title}】...`)

      let { medias } = await client.fav.fetchAll({
        media_id: folder.id,
      })
      await sleepRandom(1111, 2233, signal)

      medias = medias.filter((m) => m.attr === 0)

      if (medias.length === 0) {
        showError(`【${folder.title}】：内容为空`)
        continue
      }

      const mediaCount = medias?.length ?? 0
      for (let j = 0; j < mediaCount; j++) {
        const media = medias[j]

        loading(`${logPrefix}[${i + 1}/${mediaCount}] 正在获取视频...`)
        try {
          const videoInfo = await client.videoInfo.getInfo({ aid: media.id }, { signal })
          videos.push(videoInfo)
        } catch (err) {
          showError(`【${folder.title}】：${getErrorMessage(err)}`)
        }
        if (j < mediaCount - 1) {
          await sleepRandom(1111, 2233, signal)
        }
      }
    }
    if (videos.length === 0) {
      throw new AppError('`所选的收藏夹内容为空`')
    }
    return videos
  } finally {
    loadingDialog.close()
  }
}

const getTitle = (_list: DownloadVideoData[]) => {
  if (folders.value.length === 1) {
    return `【收藏夹】${folders.value[0].title}`
  } else {
    const title = folders.value
      .slice(0, 3)
      .map((f) => f.title)
      .join(', ')
    return `【收藏夹】${title.slice(0, 40)}${folders.value.length > 3 ? '等' : ''}`
  }
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
