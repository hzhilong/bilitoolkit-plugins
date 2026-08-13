<script setup lang="ts">
import { ref, useTemplateRef, onUnmounted } from 'vue'
import {
  PluginPageContent,
  useSelectedUserStore,
  LogPrint,
  VirtualSelectDialog,
  type VirtualSelectDialogProps,
  AppTooltip,
} from 'bilitoolkit-ui'
import { getErrorMessage, sleepRandom } from '@ybgnb/utils'
import { BiliClient } from '@ybgnb/bili-api'
import { storeToRefs } from 'pinia'
import { fetchCommentsByNotif } from '@/utils/fetch-comment'
import type { CommentMeta, CommentWithNotif } from '@/types'
import { AppError } from 'bilitoolkit-types'
import { deleteComments } from '@/utils/delete-comment'
import { handleCopyComment, handleOpenComment } from '@/utils/action'

const userStore = useSelectedUserStore()
const { assertLoggedIn } = userStore
const { user } = storeToRefs(userStore)
const loggerRef = useTemplateRef<InstanceType<typeof LogPrint>>('loggerRef')
const virtualSelectDialogProps = ref<VirtualSelectDialogProps<CommentMeta, 'rpid'>>({
  title: '请选择要删除的评论',
  options: [],
  defaultSelectedIds: [],
  getDataLabel: (item: CommentMeta) => item.title,
  idKey: 'rpid',
  multiple: true,
  canSelectAll: true,
  itemHeight: 28,
  itemWidth: 700,
})
const virtualSelectDialogVisible = ref<boolean>(false)

const addLog = (msg: string) => {
  loggerRef.value?.addLog(msg)
}
const handleClearLog = () => {
  loggerRef.value?.reset()
}

const loading = ref<boolean>(false)
let abortController: AbortController | null = null
const handleStart = async () => {
  if (loading.value) {
    abortController?.abort()
    abortController = null
    loading.value = false
    virtualSelectDialogProps.value.options = []
    virtualSelectDialogVisible.value = false
    return
  }

  try {
    assertLoggedIn()
    loading.value = true
    abortController = new AbortController()
    const signal = abortController.signal
    const client = new BiliClient({
      context: {
        userCookie: user.value!.userCookie,
      },
    })
    const logger = (msg: string) => {
      addLog(msg)
    }

    virtualSelectDialogProps.value.options = await fetchCommentsByNotif({
      client,
      logger,
      signal,
    })
    virtualSelectDialogVisible.value = true
  } catch (e) {
    addLog(getErrorMessage(e))
  } finally {
    abortController?.abort()
    abortController = null
    loading.value = false
  }
}

onUnmounted(() => abortController?.abort())

const handleDelete = async (list: CommentMeta[]) => {
  try {
    if (!list || list.length === 0) throw new AppError('未选择数据')

    loading.value = true
    abortController = new AbortController()
    const signal = abortController.signal
    const client = new BiliClient({
      context: {
        userCookie: user.value!.userCookie,
      },
    })
    const logger = (msg: string) => {
      addLog(msg)
    }
    await deleteComments(
      {
        client,
        logger,
        signal,
      },
      list,
      async (item: CommentMeta) => {
        const comment = item as CommentWithNotif
        if (comment.likeMsgId) {
          await sleepRandom(999, 1333, signal)
          await client.message.setLikeMsgState(comment.likeMsgId, 1, { signal })
          await sleepRandom(999, 1333, signal)
          await client.message.delLikeMessage(comment.likeMsgId, { signal })
        } else if (comment.replyMsgId) {
          await sleepRandom(999, 1333, signal)
          await client.message.delReplyMessage(comment.replyMsgId, { signal })
        }
        addLog(`已删除关联的通知消息`)
      },
    )
  } catch (e) {
    addLog(getErrorMessage(e))
  } finally {
    abortController?.abort()
    abortController = null
    loading.value = false
  }
}
</script>

<template>
  <PluginPageContent
    ><div class="page-content">
      <el-alert
        show-icon
        title="通过被回复/被点赞的互动通知，删除其中能定位到的互动评论，并同时删除这些通知"
        :closable="false"
      ></el-alert>
      <div class="actions">
        <el-button @click="handleStart">{{ loading ? '停止操作' : '查询所有评论' }}</el-button>
        <el-button @click="handleClearLog">清空日志</el-button>
      </div>
      <LogPrint ref="loggerRef" class="log-print-box"></LogPrint>
    </div>
    <VirtualSelectDialog v-bind="virtualSelectDialogProps" v-model="virtualSelectDialogVisible" @confirm="handleDelete">
      <template #item-label="{ item }: { item: CommentMeta }">
        <div class="comment-item">
          <AppTooltip class="comment-item-title" :content="item.title" />
          <el-button link type="primary" @click.stop="handleCopyComment(item)">复制链接</el-button>
          <el-button link type="primary" @click.stop="handleOpenComment(item)">打开</el-button>
        </div>
      </template>
    </VirtualSelectDialog>
  </PluginPageContent>
</template>

<style scoped lang="scss">
.page-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

.comment-item {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 10px;

  .comment-item-title {
    flex: 1;
    min-width: 0;
  }
}
</style>
