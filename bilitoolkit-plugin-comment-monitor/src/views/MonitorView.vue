<template>
  <div class="monitor-page">
    <template v-if="page === 'list'">
      <div class="page-header">
        <div>
          <h2>配置</h2>
        </div>

        <el-button type="primary" :icon="Plus" @click="handleCreate"> 创建配置 </el-button>
      </div>

      <el-table class="config-table" v-if="configs.length" :data="configs" row-key="name" border>
        <el-table-column prop="name" label="配置名称" width="120" align="center" />

        <!-- @vue-generic {MonitorConfig}-->
        <el-table-column label="评论区" min-width="160" align="center">
          <template #default="{ row }">
            <el-tag disable-transitions>{{ row.commentSectionMeta.contentType }}</el-tag>
            <div>{{ row.url }}</div>
          </template>
        </el-table-column>

        <!-- @vue-generic {MonitorConfig}-->
        <el-table-column label="创建/更新时间" width="160" align="center">
          <template #default="{ row }">
            <div>{{ formatTime(row.createTime) }}</div>
            <div>{{ row.updateTime ? formatTime(row.updateTime) : '-' }}</div>
          </template>
        </el-table-column>

        <!-- @vue-generic {MonitorConfig}-->
        <el-table-column label="操作" width="60" align="center">
          <template #default="{ row }: { row: MonitorConfig }">
            <div>
              <el-button link type="primary" @click="handleOpen(row)"> 打开 </el-button>
            </div>

            <div><el-button link @click="handleEdit(row)"> 编辑 </el-button></div>

            <div>
              <el-popconfirm
                title="确定删除这个配置吗？"
                confirm-button-text="删除"
                cancel-button-text="取消"
                @confirm="handleDelete(row)"
              >
                <template #reference>
                  <el-button link type="danger"> 删除 </el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-else description="暂无配置"> </el-empty>
    </template>

    <template v-else-if="page === 'monitor' && currentConfig">
      <div class="monitor-header">
        <div class="monitor-title">
          <el-button :icon="ArrowLeft" circle @click="backToList" />

          <div>
            <h2>{{ currentConfig.name }}</h2>
            <span>{{ currentConfig.commentSectionMeta.contentType }} {{ currentConfig.url }}</span>
          </div>
        </div>

        <div class="monitor-actions">
          <el-button v-if="!running" type="primary" @click="handleStartMonitor"> 开始监听 </el-button>

          <el-button v-if="running" type="primary" @click="handleStopMonitor"> 停止监听 </el-button>
          <el-button type="primary" @click="resetLog"> 清空日志 </el-button>
        </div>
      </div>

      <div class="monitor-content">
        <div class="content-card">
          <div class="card-title">已发现的评论</div>

          <div class="comment-list">
            <bili-reply v-for="reply in currentConfig.result" :reply="reply" :key="reply.rpid"></bili-reply>
          </div>
        </div>
        <div class="content-card">
          <div class="card-title">操作日志</div>
          <LogPrint class="log-container" ref="logPrintRef"></LogPrint>
        </div>
      </div>
    </template>

    <monitor-modal v-model="dialogVisible" :config="editingConfig" @save="saveMonitorConfig"></monitor-modal>
  </div>
</template>

<script setup lang="ts">
import MonitorModal from '@/components/MonitorModal.vue'
import { commentService } from '@/service/comment'
import { useAppSettingsStore } from '@/stores/app-settings'
import { useMonitorConfigStore } from '@/stores/monitor-config'
import { type MonitorConfig } from '@/types'
import { handlePush } from '@/utils/push'
import { ArrowLeft, Plus } from '@element-plus/icons-vue'
import { BiliClient } from '@ybgnb/bili-api'
import { formatTime } from '@ybgnb/utils'
import type { BiliCommentEntity } from 'bili-comment-core'
import { loadingDialog, LogPrint, showConfirm, useSelectedUserStore } from 'bilitoolkit-ui'
import { storeToRefs } from 'pinia'
import { ref, useTemplateRef } from 'vue'

type Page = 'list' | 'monitor'

const page = ref<Page>('list')

const { assertLoggedIn } = useSelectedUserStore()
const currentConfig = ref<MonitorConfig | null>(null)

const dialogVisible = ref(false)
const editingConfig = ref<MonitorConfig | null>(null)

const monitorConfigStore = useMonitorConfigStore()
const { monitorConfigs: configs } = storeToRefs(monitorConfigStore)
const { saveMonitorConfig } = monitorConfigStore
const logPrintRef = useTemplateRef<InstanceType<typeof LogPrint>>('logPrintRef')
const addLog = (msg: string) => {
  logPrintRef.value?.addLog(msg)
}
const resetLog = () => {
  logPrintRef.value?.reset()
}

const running = ref<boolean>(false)
let client: BiliClient | null = null
let abortController: AbortController | null = null
let timer: ReturnType<typeof setTimeout> | null = null

function handleCreate() {
  editingConfig.value = null
  dialogVisible.value = true
}

function handleEdit(config: MonitorConfig) {
  editingConfig.value = config
  dialogVisible.value = true
}

function handleOpen(config: MonitorConfig) {
  currentConfig.value = config
  page.value = 'monitor'
}

function handleDelete(config: MonitorConfig) {
  const index = configs.value.findIndex((c) => c.uuid === config.uuid)
  if (index > -1) {
    configs.value.splice(index, 1)
  }
}

const runMonitor = async () => {
  if (!currentConfig.value || !client || abortController?.signal.aborted) return

  addLog('---------------------')
  addLog('获取评论中...')
  const collection = await commentService.fetchComments(currentConfig.value.commentSectionMeta.source, {
    abortSignal: abortController?.signal,
    client: client,
    ...useAppSettingsStore().appSettings,
  })

  if (!currentConfig.value || abortController?.signal.aborted) return

  addLog('解析评论中...')
  const oldRpids = currentConfig.value.result.map((r) => r.rpid)
  const targetUids = currentConfig.value.targetUids

  const newComments: BiliCommentEntity[] = []

  for (const comment of collection.comments) {
    if (targetUids.includes(comment.senderUid) && !oldRpids.includes(comment.rpid)) {
      addLog(`发现评论 [${comment.senderName}](${comment.senderUid})：${comment.content}`)
      newComments.push(comment)
    }
  }
  for (const root of Object.values(collection.replies)) {
    for (const comment of root) {
      if (targetUids.includes(comment.senderUid) && !oldRpids.includes(comment.rpid)) {
        addLog(`发现评论 [${comment.senderName}](${comment.senderUid})：${comment.content}`)
        newComments.push(comment)
      }
    }
  }

  if (newComments.length === 0) {
    addLog('暂未发现最新评论')
  } else {
    newComments.sort((a, b) => b.ctime - a.ctime)
    currentConfig.value.result.unshift(...newComments)
    await handlePush(currentConfig.value, newComments, addLog)
  }

  addLog('等待下一次查询...')
  timer = setTimeout(runMonitor, currentConfig.value.interval * 1000)
}

const handleStartMonitor = async () => {
  if (!currentConfig.value) return
  assertLoggedIn()

  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  abortController = new AbortController()
  client = new BiliClient()
  running.value = true

  await runMonitor()
}

const handleStopMonitor = async () => {
  try {
    loadingDialog.show('停止中')
    if (timer) {
      clearTimeout(timer)
    }
    abortController?.abort()
  } finally {
    abortController = null
    timer = null
    running.value = false
    loadingDialog.close()
    addLog('停止监听')
  }
}

async function backToList() {
  if (abortController) {
    await showConfirm('确定停止监听吗？')
    await handleStopMonitor()
  }
  page.value = 'list'
  currentConfig.value = null
}
</script>

<style scoped lang="scss">
.monitor-page {
  width: 100%;
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.page-header,
.monitor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-header h2,
.monitor-title h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.page-header p {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.monitor-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.monitor-title > div:last-child {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.monitor-title span {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.monitor-actions {
  display: flex;
  gap: 8px;
}

.monitor-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;

  .content-card {
    min-height: 0;
    flex: 1;
    display: flex;
    flex-direction: column;

    .card-title {
      font-size: 16px;
      line-height: 2;
      margin: 6px 0;
      font-weight: 600;
    }

    .comment-list,
    .log-container {
      min-height: 0;
      flex: 1;
    }

    .comment-list {
      border: 1px solid var(--el-border-color);
      border-radius: 4px;
      padding: 10px;
      overflow-y: auto;
    }
  }
}

.config-table {
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  margin-top: 16px;
}
</style>
