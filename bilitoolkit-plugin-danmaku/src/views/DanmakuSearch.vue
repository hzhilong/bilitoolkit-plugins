<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { PluginPageContent, useSelectedUserStore, AppTooltip, useLoadingData } from 'bilitoolkit-ui'
import { storeToRefs } from 'pinia'
import { RecycleScroller } from 'vue-virtual-scroller'
import { parseVideoId } from '@/utils/parse-video'
import { type VideoPart, type DanmakuElem, type UserInfo, type UserCard } from '@ybgnb/bili-api'
import { sleepRandom } from '@ybgnb/utils'
import { formatDuration } from '@/utils/dm'
import { crackUidHash } from '@/utils/crack'
import { Search, ArrowUp } from '@element-plus/icons-vue'
import { client } from '@/common/client'
import { cloneDeep } from 'lodash-es'

interface DMItem extends DanmakuElem {
  cracked?: boolean
  loading?: boolean
  uids: number[]
  users: UserCard[]
}

const { loading, loadingData } = useLoadingData()
const { loading: loadingTable, loadingData: loadingTableData } = useLoadingData()
const videoUrl = ref('')
const queryParams = ref<{ keyword?: string; uid?: number }>({})
const videoPart = ref<VideoPart>()
const parts = ref<VideoPart[]>([])
const searched = ref<boolean>(false)
let dmList: DMItem[] = []
const filteredList = ref<DMItem[]>([])

const { user } = storeToRefs(useSelectedUserStore())
const assertLoggedIn = () => {
  if (user.value == null) {
    throw new Error('请先登录')
  }
}

const fetchParts = loadingData(async () => {
  assertLoggedIn()
  const videoId = await parseVideoId(videoUrl.value)
  parts.value = await client.videoInfo.getParts(videoId)
  await sleepRandom(500, 777)
  videoPart.value = parts.value.length > 0 ? parts.value[0] : undefined
})

const handleSearch = loadingData(async () => {
  assertLoggedIn()
  searched.value = false
  cancelCrackAll()
  queryParams.value = {}
  dmList = (await client.dm.fetchAll(videoPart.value!))
    .sort((a, b) => a.progress - b.progress)
    .map((dm) => ({ ...dm, uids: [], users: [] }))
  filteredList.value.splice(0, filteredList.value.length, ...dmList)
  searched.value = true
  console.log(`queryParams.value`, queryParams.value)
})

const formatUserLabel = (user: UserInfo) => {
  return `${user.name}　${user.mid}　lv${user.level}`
}

const crackUser = async (item: DMItem) => {
  try {
    item.loading = true
    const uids = crackUidHash(item.midHash)
    item.uids.splice(0, item.uids.length, ...uids)
    const users = (await client.user.getUserCards(uids)).filter((u) => u != null && u.level > 1) as UserCard[]
    await sleepRandom(1111, 2222)
    item.users.splice(0, item.users.length, ...users)
    item.cracked = true
  } finally {
    item.loading = false
    setTimeout(() => {}, 2000)
  }
}
const handleOpenSpace = (user: UserInfo) => {
  assertLoggedIn()
  window.open(`https://space.bilibili.com/${user.mid}`)
}

const searchTableData = loadingTableData(async () => {
  const { keyword, uid } = queryParams.value

  if (!keyword && !uid) {
    filteredList.value.splice(0, filteredList.value.length, ...dmList)
    return
  }

  const matched = dmList.filter((d) => {
    if (keyword && !d.content.includes(keyword)) return false
    if (uid && !d.uids.includes(uid)) return false
    return true
  })

  filteredList.value.splice(0, filteredList.value.length, ...matched)
})

let crackingAll = ref(false)
let abortController: AbortController | null = null
const cancelCrackAll = () => abortController?.abort()

onUnmounted(cancelCrackAll)

const handleCrackAll = loadingTableData(async () => {
  if (crackingAll.value) {
    cancelCrackAll()
    return
  }
  try {
    crackingAll.value = true
    abortController = new AbortController()
    const signal = abortController.signal

    const targets = filteredList.value.map((item, index) => ({ item, index })).filter(({ item }) => !item.cracked)

    let chunkList: DMItem[] = []
    let chunkUids: number[] = []

    const parseChunkUids = async () => {
      try {
        const users = (await client.user.getUserCards(chunkUids, { signal })).filter(
          (u) => u != null && u.level > 1,
        ) as UserCard[]
        await sleepRandom(1111, 2222)
        const usersMap = new Map(users.map((u) => [u.mid, u]))
        for (let dmItem of chunkList) {
          dmItem.users.splice(
            0,
            dmItem.users.length,
            ...dmItem.uids.filter((u) => usersMap.has(u)).map((u) => usersMap.get(u)!),
          )
          dmItem.cracked = true
          dmItem.loading = false
        }
        chunkUids.length = 0
        chunkList.length = 0
      } catch (e) {
        for (let dmItem of chunkList) {
          dmItem.cracked = false
          dmItem.loading = false
        }
        throw e
      }
    }

    for (let i = 0; i < targets.length; i++) {
      const { item } = targets[i]
      item.loading = true
      item.uids.splice(0, item.uids.length, ...crackUidHash(item.midHash))
      if (chunkUids.length + item.uids.length > 50) {
        await parseChunkUids()
      }
      chunkList.push(item)
      chunkUids.push(...item.uids)
    }
    if (chunkUids.length > 0) {
      await parseChunkUids()
    }
  } finally {
    crackingAll.value = false
  }
})

const isCollapseQuery = ref(false)
</script>

<template>
  <PluginPageContent v-loading="loading">
    <div class="page-content">
      <div class="query-section" :class="isCollapseQuery ? 'collapse' : ''">
        <div class="query-form-wrapper">
          <div class="query-form">
            <div></div>
            <el-input v-model.trim="videoUrl" placeholder="请输入B站视频链接 / b23分享链接 / BV号 / av号">
              <template #prepend> 视频链接 </template>
              <template #append><el-button type="primary" :icon="Search" @click="fetchParts"></el-button></template>
            </el-input>
            <el-select v-model="videoPart" v-if="parts.length > 0">
              <template #prefix>视频分 P</template>
              <el-option v-for="item in parts" :key="item.cid" :label="item.part" :value="item" />
            </el-select>
            <el-button v-if="videoPart" type="primary" @click="handleSearch">查询弹幕</el-button>
          </div>
        </div>
        <div class="collapse-arrow" v-if="searched" @click="isCollapseQuery = !isCollapseQuery">
          <span v-if="isCollapseQuery">{{ videoPart?.part }}</span>
          <el-icon><ArrowUp /></el-icon>
        </div>
      </div>
      <div v-if="dmList && dmList.length > 0" class="table-wrapper">
        <div class="hint">温馨提示：超过 10 位的用户 uid 无法解析</div>
        <div class="table-query">
          <div class="total-label">{{ `当前弹幕数量 ：${filteredList.length}` }}</div>
          <el-input v-model.trim="queryParams.keyword" placeholder="" clearable>
            <template #prepend>关键词</template>
          </el-input>
          <el-input v-model.number="queryParams.uid" type="number" placeholder="" clearable>
            <template #prepend>用户uid</template>
          </el-input>
          <el-button type="primary" @click="searchTableData">查询</el-button>
          <el-button type="primary" @click="handleCrackAll">{{
            crackingAll ? '取消解析' : '解析当前所有发送者'
          }}</el-button>
        </div>
        <div class="table-header">
          <div class="col index">序号</div>
          <div class="col progress">视频时间</div>
          <div class="col content">弹幕内容</div>
          <div class="col users">发送者</div>
        </div>
        <div class="table-body-wrapper" v-loading="loadingTable">
          <RecycleScroller
            class="table-body"
            :items="filteredList"
            :item-size="(t: DMItem) => 26 * ((t.users ?? []).length || 1)"
            key-field="id"
            v-slot="{ item, index }: { item: DMItem }"
          >
            <div class="table-row">
              <div class="col index">{{ index + 1 }}</div>
              <div class="col progress">{{ formatDuration(item.progress / 1000) }}</div>
              <AppTooltip class="col content" :content="item.content"></AppTooltip>
              <div class="col users">
                <span v-if="!item.cracked">
                  <template v-if="item.loading">解析中</template>
                  <el-button v-else link type="primary" size="small" @click="crackUser(item)">解析</el-button>
                </span>
                <div v-else>
                  <div class="cell-users">
                    <el-button
                      link
                      type="primary"
                      size="small"
                      v-for="user in item.users"
                      @click="handleOpenSpace(user)"
                      >{{ formatUserLabel(user) }}</el-button
                    >
                  </div>
                </div>
              </div>
            </div>
          </RecycleScroller>
        </div>
      </div>
    </div>
  </PluginPageContent>
</template>

<style scoped lang="scss">
.page-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 20px;

  .query-section {
    width: 560px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0 auto;

    .query-form-wrapper {
      display: grid;
      grid-template-rows: 1fr;
      transition: grid-template-rows 0.35s ease;

      .query-form {
        display: flex;
        min-height: 0;
        flex-direction: column;
        gap: 10px;
        overflow: hidden;
        > div {
          width: 100%;
        }
      }
    }

    .collapse-arrow {
      width: fit-content;
      display: inline-flex;
      align-items: center;
      margin: 0 auto;
      padding: 2px 4px;
      cursor: pointer;

      ::v-deep(.el-icon) {
        transition: transform 0.3s ease;
      }

      &:hover {
        background-color: var(--app-color-primary-transparent-10);
      }
    }

    &.collapse {
      .query-form-wrapper {
        grid-template-rows: 0fr;
      }

      ::v-deep(.el-icon) {
        transform: rotate(-180deg);
        transform-origin: center;
      }
    }
  }

  .table-wrapper {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border-top: 1px solid var(--el-border-color);
    padding-top: 10px;

    .hint {
      margin-bottom: 8px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    ::v-deep(.vue-recycle-scroller__item-view) {
      width: 100%;
    }

    .table-header,
    .table-row {
      display: grid;
      grid-template-columns: 44px 74px 4fr 2fr;
      align-items: center;
      width: 100%;
      border-bottom: 1px solid var(--el-border-color);
    }

    .col {
      height: 26px;
      text-align: center;
    }

    .table-header {
      font-weight: bold;
      padding-right: 8px;
    }

    .table-body-wrapper {
      flex: 1;
      min-height: 0;
      .table-body {
        position: relative;
        height: 100%;
        overflow-y: auto;
      }
    }

    .col.users {
      height: fit-content;
    }

    .cell-users {
      display: flex;
      flex-direction: column;
      align-items: flex-start;

      ::v-deep(.el-button + .el-button) {
        margin-left: 0 !important;
      }

      ::v-deep(.el-button) {
        height: 26px !important;
        line-height: 26px !important;
        user-select: text;
      }
    }

    .table-query {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 20px;
      margin-bottom: 20px;
      ::v-deep(.el-input-group) {
        width: 260px;
      }

      .total-label {
        margin-right: auto;
      }
    }
  }
}
</style>
