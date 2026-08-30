<script setup lang="ts">
import { ref, useTemplateRef, onUnmounted } from 'vue'
import {
  PluginPageContent,
  useSelectedUserStore,
  LogPrint,
  VirtualSelectDialog,
  type VirtualSelectDialogProps,
  AppTooltip,
  QueryFormItem,
} from 'bilitoolkit-ui'
import { getErrorMessage, formatTime } from '@ybgnb/utils'
import { BiliClient } from '@ybgnb/bili-api'
import { storeToRefs } from 'pinia'
import { fetchCommentsByAicu } from '@/utils/aicu'
import { deleteComments } from '@/utils/delete-comment'
import type { AicuCommentMeta } from '@/types'
import { AppError } from 'bilitoolkit-types'
import { handleCopyComment, handleOpenComment } from '@/utils/action'

const userStore = useSelectedUserStore()
const { assertLoggedIn } = userStore
const { user } = storeToRefs(userStore)
const loggerRef = useTemplateRef<InstanceType<typeof LogPrint>>('loggerRef')
const virtualSelectDialogProps = ref<VirtualSelectDialogProps<AicuCommentMeta, 'rpid'>>({
  title: '请选择要删除的评论',
  options: [],
  defaultSelectedIds: [],
  getDataLabel: (item: AicuCommentMeta) => item.title,
  idKey: 'rpid',
  multiple: true,
  canSelectAll: true,
  itemHeight: 28,
  itemWidth: 700,
})
const virtualSelectDialogVisible = ref<boolean>(false)

const keyword = ref('')
const mode = ref<string>('0')
const timeRange = ref<[number, number] | null>(null)

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

    virtualSelectDialogProps.value.options = await fetchCommentsByAicu(
      {
        client,
        logger,
        signal,
        uid: user.value!.mid,
      },
      {
        stime: timeRange.value?.[0],
        etime: timeRange.value?.[1],
        mode: mode.value,
        keyword: keyword.value,
      },
    )
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

const handleDelete = async (list: AicuCommentMeta[]) => {
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
  <PluginPageContent>
    <div class="page-content">
      <el-alert
        show-icon
        title="通过查询 Aicu 并删除自己的所有评论"
        description="仅删除自己在 B 站发布的评论，Aicu 中的数据不会受到影响。"
        :closable="false"
      />
      <div class="query-list">
        <QueryFormItem prefix="关键词" style="width: fit-content">
          <el-input v-model="keyword" placeholder="" clearable />
        </QueryFormItem>
        <QueryFormItem prefix="评论类型" style="width: fit-content">
          <el-select v-model="mode" placeholder="" style="width: 120px">
            <el-option label="所有评论" value="0" />
            <el-option label="一级评论" value="1" />
            <el-option label="二级评论" value="2" />
          </el-select>
        </QueryFormItem>
      </div>
      <div class="query-list">
        <QueryFormItem prefix="日期范围" style="width: fit-content">
          <el-date-picker
            v-model="timeRange"
            type="datetimerange"
            value-format="x"
            start-placeholder=""
            clearable
            end-placeholder=""
          />
        </QueryFormItem>
      </div>
      <div class="actions">
        <el-button @click="handleStart">{{ loading ? '停止操作' : '查询所有评论' }}</el-button>
        <el-button @click="handleClearLog">清空日志</el-button>
      </div>
      <LogPrint ref="loggerRef" class="log-print-box"></LogPrint>
    </div>
    <VirtualSelectDialog v-bind="virtualSelectDialogProps" v-model="virtualSelectDialogVisible" @confirm="handleDelete">
      <template #item-label="{ item }: { item: AicuCommentMeta }">
        <div class="comment-item">
          <span class="comment-item-time">{{ formatTime(item.time) }}</span>
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

  .query-list {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 20px;
  }

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
  gap: 20px;

  .comment-item-title {
    flex: 1;
    min-width: 0;
  }
}
</style>
