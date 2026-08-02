<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { PluginPageContent, useSelectedUserStore, loadingDialog, LogPrint } from 'bilitoolkit-ui'
import { parseCommentSourceUrl, type BiliCommentSource } from 'bili-comment-core'
import { Download } from '@element-plus/icons-vue'
import { commentService } from '@/service/comment'
import { storeToRefs } from 'pinia'
import { useAppSettingsStore } from '@/stores/app-settings'
import { publicClient } from 'bilitoolkit-runtime/biliapi'
import { sleep } from '@ybgnb/utils'
import type { UserContent, ContentWithComment, ContentType } from '@/types'
import { AppError } from 'bilitoolkit-types'
import { exportContentWithComment } from '@/utils/file'
import { getTotalCommentCount } from '@/utils/comment'

const { assertLoggedIn } = useSelectedUserStore()
const { appSettings } = storeToRefs(useAppSettingsStore())
const url = ref('')
const loggerRef = useTemplateRef<InstanceType<typeof LogPrint>>('loggerRef')

const addLog = (msg: string) => {
  loggerRef.value?.addLog(msg)
}
const handleClearLog = () => {
  loggerRef.value?.reset()
}

const handleExport = async () => {
  try {
    assertLoggedIn()
    const abortController = new AbortController()
    loadingDialog.show({
      message: '获取评论中...',
      showCancel: true,
      onCancel: () => abortController.abort(),
    })
    const commentSource = await parseCommentSourceUrl(url.value)

    let content: UserContent
    let contentType: ContentType
    if (commentSource.type === 1) {
      content = await publicClient.videoInfo.getInfo({
        aid: commentSource.aid,
      })
      contentType = '视频'
    } else if (commentSource.type === 11 || commentSource.type === 12) {
      if ('opusDetail' in commentSource && commentSource.opusDetail) {
        content = commentSource.opusDetail
      } else {
        content = await publicClient.opus.getInfo(Number(commentSource.oid))
      }
      contentType = commentSource.type === 11 ? '图文动态' : '专栏'
    } else if (commentSource.type === 17) {
      content = await publicClient.dynamic.getDetail({
        id: commentSource.dynamicOid,
        // TODO rid??
      })
      contentType = '动态'
    } else {
      throw new AppError(`未知的评论区类型：${commentSource.type}`)
    }
    await sleep(333)
    const collection = await commentService.fetchComments(commentSource, {
      client: publicClient,
      ...appSettings.value,
      logger: addLog,
      abortSignal: abortController.signal,
    })

    addLog(`总共获取 ${getTotalCommentCount(collection)} 条评论`)
    const contentWithComment: ContentWithComment = {
      source: {
        oid: commentSource.oid,
        type: commentSource.type,
      } as BiliCommentSource,
      content: content,
      contentType,
      ...collection,
    }
    addLog(`正在导出文件`)
    addLog(`成功导出文件： ${await exportContentWithComment(contentType, contentWithComment)}`)
  } finally {
    loadingDialog.close()
  }
}
</script>

<template>
  <PluginPageContent>
    <div class="page-content">
      <div class="actions">
        <el-input
          v-model.trim="url"
          placeholder="请输入视频链接 / BV号 / av号 / 动态链接 / 专栏链接"
          style="max-width: 70%"
        >
          <template #prepend> 链接 </template>
          <template #append>
            <el-button :icon="Download" @click="handleExport" />
          </template>
        </el-input>
        <el-button @click="handleClearLog">清空日志</el-button>
      </div>

      <LogPrint ref="loggerRef" class="log-print-box"></LogPrint>
    </div>
  </PluginPageContent>
</template>

<style scoped lang="scss">
.page-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 10px;

  .actions {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .log-print-box {
    width: 100%;
    flex: 1;
    min-height: 0;
  }
}
</style>
