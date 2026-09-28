<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { PluginPageContent, showToast } from 'bilitoolkit-ui'
import { fetchBootstrap, fetchHistory, resolveRoomOwner } from '@/services/danmakus-api'
import type { DanmakuRecord, DanmakuSession, QueryHistoryItem, WatchedChannel } from '@/types/danmaku'

const HISTORY_DB_KEY = 'query-history'
const SETTINGS_DB_KEY = 'search-settings'
const HISTORY_LIMIT = 20

const uid = ref('')
const loading = ref(false)
const loadingMore = ref(false)
const loadingFilter = ref(false)
const searched = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const hasMore = ref(false)
const sessions = ref<DanmakuSession[]>([])
const watchedChannels = ref<WatchedChannel[]>([])
const queryHistory = ref<QueryHistoryItem[]>([])
const channelFilter = ref('')
const keywordFilter = ref('')
const activeChannelUserId = ref('')
const activeChannelLabel = ref('')
let abortController: AbortController | undefined

const recordCount = computed(() =>
  sessions.value.reduce((count, session) => count + session.danmakus.records.length, 0),
)

const filteredSessions = computed(() => {
  const keyword = keywordFilter.value.trim().toLocaleLowerCase()
  if (!keyword) return sessions.value

  return sessions.value
    .map((session) => ({
      ...session,
      danmakus: {
        ...session.danmakus,
        records: session.danmakus.records.filter((record) =>
          recordContent(session, record).toLocaleLowerCase().includes(keyword),
        ),
      },
    }))
    .filter((session) => session.danmakus.records.length > 0)
})

const filteredRecordCount = computed(() =>
  filteredSessions.value.reduce((count, session) => count + session.danmakus.records.length, 0),
)

function normalizeUid(value: string) {
  return value.replace(/\D/g, '').replace(/^0+/, '')
}

function formatDate(timestamp: number) {
  if (!timestamp) return '时间未知'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(timestamp))
}

function actorName(session: DanmakuSession, record: DanmakuRecord) {
  return session.danmakus.actors[record.actorId]?.name || uid.value
}

function recordContent(session: DanmakuSession, record: DanmakuRecord) {
  if (record.payload?.rawText) return record.payload.rawText
  if (record.payloadKind === 2 && record.payload?.roomEmojiId !== undefined) {
    return `[表情] ${session.danmakus.roomEmojis[record.payload.roomEmojiId]?.name || ''}`.trim()
  }
  const actionNames: Record<number, string> = { 1: '赠送礼物', 2: '醒目留言', 3: '上舰', 4: '进入直播间' }
  return actionNames[record.type] || `互动记录（类型 ${record.type}）`
}

async function saveHistory(name: string) {
  const item: QueryHistoryItem = { uid: uid.value, name: name || `UID ${uid.value}`, queriedAt: Date.now() }
  queryHistory.value = [item, ...queryHistory.value.filter((entry) => entry.uid !== item.uid)].slice(0, HISTORY_LIMIT)
  await window.toolkitApi.db.write(HISTORY_DB_KEY, { items: queryHistory.value })
}

async function search(targetUid = uid.value) {
  const normalized = normalizeUid(targetUid)
  if (!normalized) {
    showToast('请输入有效的 UID')
    return
  }

  uid.value = normalized
  abortController?.abort()
  abortController = new AbortController()
  loading.value = true
  searched.value = false
  try {
    const data = await fetchBootstrap(normalized, pageSize.value, abortController.signal)
    sessions.value = data.history.items || []
    watchedChannels.value = data.watchedChannels || []
    total.value = data.history.total || 0
    page.value = 1
    hasMore.value = data.history.hasMore
    channelFilter.value = ''
    keywordFilter.value = ''
    activeChannelUserId.value = ''
    activeChannelLabel.value = ''
    searched.value = true
    const userName = sessions.value
      .flatMap((item) => item.danmakus.actors)
      .find((actor) => String(actor.uid) === normalized)?.name
    await saveHistory(userName || data.historyUserNames?.[0] || '')
  } catch (error) {
    if ((error as Error).name !== 'AbortError') showToast((error as Error).message || '查询失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  if (!hasMore.value || loadingMore.value || loadingFilter.value) return
  loadingMore.value = true
  try {
    const nextPage = page.value + 1
    const data = await fetchHistory(uid.value, nextPage, pageSize.value, activeChannelUserId.value || undefined)
    sessions.value.push(...(data.items || []))
    page.value = nextPage
    hasMore.value = data.hasMore
  } catch (error) {
    showToast((error as Error).message || '加载失败，请稍后重试')
  } finally {
    loadingMore.value = false
  }
}

async function reloadFirstPage(channelUserId = activeChannelUserId.value, channelLabel = activeChannelLabel.value) {
  const data = await fetchHistory(uid.value, 1, pageSize.value, channelUserId || undefined)
  sessions.value = data.items || []
  total.value = data.total || 0
  page.value = 1
  hasMore.value = data.hasMore
  activeChannelUserId.value = channelUserId
  activeChannelLabel.value = channelLabel
}

async function changePageSize(value?: number) {
  pageSize.value = Math.min(100, Math.max(1, Number(value) || 10))
  await window.toolkitApi.db.write(SETTINGS_DB_KEY, { pageSize: pageSize.value })
  if (!searched.value) return

  loadingFilter.value = true
  try {
    await reloadFirstPage()
  } catch (error) {
    showToast((error as Error).message || '调整加载数量失败')
  } finally {
    loadingFilter.value = false
  }
}

async function applyChannelFilter() {
  const value = channelFilter.value.trim()
  loadingFilter.value = true
  try {
    let channelUserId = ''
    let channelLabel = ''

    if (/^\d+$/.test(value)) {
      const room = await resolveRoomOwner(value)
      channelUserId = String(room.uid)
      const channel = watchedChannels.value.find((item) => String(item.uId) === channelUserId)
      channelLabel = channel ? `${channel.uName}（房间 ${room.room_id}）` : `房间 ${room.room_id}`
    } else if (value) {
      const normalized = value.toLocaleLowerCase()
      const exact = watchedChannels.value.find((item) => item.uName.toLocaleLowerCase() === normalized)
      const matches = watchedChannels.value.filter((item) => item.uName.toLocaleLowerCase().includes(normalized))
      if (!exact && matches.length === 0) throw new Error('该用户的记录中没有匹配的主播')
      if (!exact && matches.length > 1) throw new Error(`匹配到 ${matches.length} 位主播，请输入更完整的名称`)
      const channel = exact || matches[0]
      channelUserId = String(channel.uId)
      channelLabel = channel.uName
    }

    await reloadFirstPage(channelUserId, channelLabel)
  } catch (error) {
    showToast((error as Error).message || '直播间筛选失败')
  } finally {
    loadingFilter.value = false
  }
}

function clearFilters() {
  channelFilter.value = ''
  keywordFilter.value = ''
  void applyChannelFilter()
}

async function removeHistory(historyUid: string) {
  queryHistory.value = queryHistory.value.filter((item) => item.uid !== historyUid)
  await window.toolkitApi.db.write(HISTORY_DB_KEY, { items: queryHistory.value })
}

async function clearHistory() {
  queryHistory.value = []
  await window.toolkitApi.db.write(HISTORY_DB_KEY, { items: [] })
}

onMounted(async () => {
  const [storedHistory, storedSettings] = await Promise.all([
    window.toolkitApi.db.init<{ items: QueryHistoryItem[] }>(HISTORY_DB_KEY, { items: [] }),
    window.toolkitApi.db.init<{ pageSize: number }>(SETTINGS_DB_KEY, { pageSize: 10 }),
  ])
  queryHistory.value = storedHistory.items || []
  pageSize.value = Math.min(100, Math.max(1, Number(storedSettings.pageSize) || 10))
})
</script>

<template>
  <PluginPageContent>
    <div class="page">
      <section class="search-card">
        <div>
          <h2>用户弹幕查询</h2>
          <p>输入 Bilibili UID，查询第三方服务已经收录的直播弹幕记录。</p>
        </div>
        <div class="search-row">
          <el-input
            v-model="uid"
            inputmode="numeric"
            clearable
            placeholder="请输入目标 UID"
            @input="uid = normalizeUid(uid)"
            @keyup.enter="search()"
          >
            <template #prepend>UID</template>
          </el-input>
          <el-button type="primary" :loading="loading" @click="search()">查询</el-button>
          <el-button v-if="loading" @click="abortController?.abort()">取消</el-button>
        </div>
        <el-alert
          title="数据由 Danmakus 第三方服务提供，查询结果取决于其收录范围和服务状态。"
          type="info"
          :closable="false"
          show-icon
        />
      </section>

      <section v-if="queryHistory.length" class="history-section">
        <div class="section-title">
          <span>本地查询记录</span>
          <el-button link type="danger" @click="clearHistory">清空</el-button>
        </div>
        <div class="history-list">
          <el-tag
            v-for="item in queryHistory"
            :key="item.uid"
            closable
            size="large"
            class="history-tag"
            @click="search(item.uid)"
            @close.stop="removeHistory(item.uid)"
          >
            {{ item.name }} · {{ item.uid }}
          </el-tag>
        </div>
      </section>

      <section v-if="searched" class="results">
        <div class="result-summary">
          <span>
            {{ activeChannelLabel ? `${activeChannelLabel}：` : '' }}共 {{ total }} 场直播记录，当前已加载
            {{ sessions.length }} 场、{{ recordCount }} 条互动
          </span>
          <div class="summary-actions">
            <span class="page-size-label">每次加载</span>
            <el-input-number
              v-model="pageSize"
              :min="1"
              :max="100"
              :step="10"
              controls-position="right"
              @change="changePageSize"
            />
            <el-button
              v-if="hasMore"
              type="primary"
              plain
              :loading="loadingMore"
              :disabled="loadingFilter"
              @click="loadMore"
            >
              加载更多
            </el-button>
            <el-button v-if="channelFilter || keywordFilter" link @click="clearFilters">清除筛选</el-button>
          </div>
        </div>

        <div class="filter-bar">
          <el-input
            v-model.trim="channelFilter"
            clearable
            placeholder="直播间房间号或主播名称"
            @keyup.enter="applyChannelFilter"
            @clear="applyChannelFilter"
          >
            <template #prepend>直播间</template>
          </el-input>
          <el-button :loading="loadingFilter" @click="applyChannelFilter">筛选直播间</el-button>
          <el-input v-model.trim="keywordFilter" clearable placeholder="例如：如果">
            <template #prepend>弹幕内容</template>
          </el-input>
        </div>
        <div v-if="keywordFilter" class="filter-hint">
          关键词正在筛选当前已加载的 {{ sessions.length }} 场直播，命中 {{ filteredSessions.length }} 场、
          {{ filteredRecordCount }} 条互动；继续“加载更多”可扩大筛选范围。
        </div>

        <el-empty
          v-if="filteredSessions.length === 0"
          :description="sessions.length ? '当前已加载记录中没有符合条件的弹幕' : '没有查询到已收录的弹幕记录'"
        />

        <article v-for="session in filteredSessions" :key="session.live.liveId" class="session-card">
          <img :src="session.channel.frameUrl || session.channel.faceUrl" class="cover" alt="直播封面" />
          <div class="session-main">
            <div class="session-header">
              <div>
                <h3>{{ session.live.title || session.channel.title || '未命名直播' }}</h3>
                <div class="meta">
                  {{ session.channel.uName }} · 房间 {{ session.channel.roomId }} ·
                  {{ formatDate(session.live.startDate) }}
                </div>
              </div>
              <el-tag effect="plain">{{ session.live.parentArea }} / {{ session.live.area }}</el-tag>
            </div>
            <div class="records">
              <div v-for="(record, index) in session.danmakus.records" :key="`${record.ts}-${index}`" class="record">
                <span class="time">{{ formatDate(record.ts).slice(11) }}</span>
                <span class="actor">{{ actorName(session, record) }}</span>
                <span class="content">{{ recordContent(session, record) }}</span>
              </div>
            </div>
          </div>
        </article>

        <div v-if="sessions.length" class="load-more">
          <el-button v-if="hasMore" :loading="loadingMore" :disabled="loadingFilter" @click="loadMore">
            加载更多（{{ pageSize }} 场）
          </el-button>
          <span v-else>已加载全部记录</span>
        </div>
      </section>
    </div>
  </PluginPageContent>
</template>

<style scoped lang="scss">
.page {
  height: 100%;
  overflow-y: auto;
  padding: 0 20px 28px;
}
.search-card {
  max-width: 820px;
  margin: 0 auto 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
h2,
h3,
p {
  margin: 0;
}
.search-card p,
.meta,
.load-more {
  color: var(--el-text-color-secondary);
}
.search-row {
  display: flex;
  gap: 10px;
}
.history-section,
.results {
  max-width: 980px;
  margin: 0 auto 20px;
}
.section-title,
.result-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  font-weight: 600;
}
.summary-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}
.page-size-label {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  font-weight: 400;
  white-space: nowrap;
}
.summary-actions :deep(.el-input-number) {
  width: 112px;
}
.filter-bar {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) auto minmax(260px, 1fr);
  gap: 10px;
  margin-bottom: 8px;
}
.filter-hint {
  margin-bottom: 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
.history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.history-tag {
  cursor: pointer;
}
.session-card {
  display: flex;
  gap: 14px;
  margin-bottom: 12px;
  padding: 14px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-bg-color);
}
.cover {
  width: 144px;
  height: 81px;
  object-fit: cover;
  border-radius: 6px;
  background: var(--el-fill-color);
}
.session-main {
  flex: 1;
  min-width: 0;
}
.session-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.session-header h3 {
  margin-bottom: 5px;
  font-size: 16px;
}
.meta {
  font-size: 12px;
}
.records {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.record {
  display: grid;
  grid-template-columns: 78px 120px minmax(0, 1fr);
  gap: 8px;
  font-size: 13px;
}
.time {
  color: var(--el-text-color-secondary);
}
.actor {
  color: var(--el-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.content {
  overflow-wrap: anywhere;
}
.load-more {
  display: flex;
  justify-content: center;
  padding: 12px;
}
@media (max-width: 720px) {
  .result-summary {
    align-items: flex-start;
    flex-direction: column;
  }
  .summary-actions {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
  .filter-bar {
    grid-template-columns: 1fr;
  }
  .search-row,
  .session-card {
    flex-direction: column;
  }
  .cover {
    width: 100%;
    height: 160px;
  }
  .record {
    grid-template-columns: 72px 100px minmax(0, 1fr);
  }
}
</style>
