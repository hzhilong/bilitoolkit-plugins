<script setup lang="ts">
import { useTemplateRef, ref, computed, onUnmounted, nextTick } from 'vue'
import { parseDMFile, createDMFile } from '@/utils/file'
import type { DMXml, DMItem } from '@/types'
import { useLoadingData, AppTooltip, useSelectedUserStore, PluginPageContent } from 'bilitoolkit-ui'
import { formatDuration, sleepRandom, formatTime } from '@ybgnb/utils'
import { RecycleScroller } from 'vue-virtual-scroller'
import { publicClient } from 'bilitoolkit-runtime/biliapi'
import type { UserCard } from '@ybgnb/bili-api'
import { crackUidHash } from '@/utils/crack'
import KeyValueTag from '@/components/KeyValueTag.vue'
import { formatColor, formatMode, formatPool, modeMap, poolMap } from '@/utils/format'
import dayjs from 'dayjs'
import QueryFormItem from '@/components/QueryFormItem.vue'

const selectedUserStore = useSelectedUserStore()
const { assertLoggedIn } = selectedUserStore
const { loading, loadingData } = useLoadingData()
const fileInputRef = useTemplateRef<HTMLInputElement>('fileInputRef')

const triggerUpload = () => fileInputRef.value?.click()

const dmMeta = ref<Omit<DMXml, 'items'>>()
const dmList = ref<DMItem[]>([])

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = loadingData(async (e) => {
    const xmlContent = e.target?.result as string
    const dmXML = await parseDMFile(xmlContent)
    if (!dmXML) {
      dmMeta.value = undefined
      dmList.value = []
      setTableData([])
    } else {
      const { items, ...meta } = dmXML
      dmMeta.value = meta
      dmList.value = items ?? []
      setTableData(dmList.value)
    }
  })
  reader.readAsText(file)
  input.value = ''
}

const dmListKey = ref(0)
const filteredList = ref<DMItem[]>([])
const setTableData = (data: DMItem[]) => {
  dmListKey.value++
  filteredList.value.splice(0, filteredList.value.length, ...data)
}
const queryParams = ref<{
  keyword?: string
  midHash?: string
  uid?: number
  mode?: number
  pool?: number
}>({})
const { loading: loadingTable, loadingData: loadingTableData } = useLoadingData()

const searchTableData = loadingTableData(async () => {
  const { keyword, uid, mode, pool, midHash } = queryParams.value

  const matched = dmList.value.filter((d) => {
    if (keyword && !d.content.includes(keyword)) return false
    if (midHash && d.midHash !== midHash) return false
    if (uid && !d.uids.includes(uid)) return false

    if (mode != null && d.mode !== mode) return false
    if (pool != null && d.pool !== pool) return false
    return true
  })

  setTableData(matched)
})

const saveFile = async () => {
  await createDMFile(
    {
      ...dmMeta.value!,
      items: dmList.value,
    },
    true,
  )
}
const crackingAll = ref(false)
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

    const chunkList: DMItem[] = []
    const chunkUids: number[] = []

    const parseChunkUids = async () => {
      try {
        const users = (await publicClient.user.getUserCards(chunkUids, { signal })).filter(
          (u) => u != null && u.level > 1,
        ) as UserCard[]
        await sleepRandom(1111, 2222)
        const usersMap = new Map(users.map((u) => [u.mid, u]))
        for (const dmItem of chunkList) {
          dmItem.users.splice(
            0,
            dmItem.users.length,
            ...dmItem.uids.filter((u) => usersMap.has(u)).map((u) => usersMap.get(u)!),
          )
          dmItem.cracked = true
          dmItem.loading = false
        }
      } catch (e) {
        for (const dmItem of chunkList) {
          dmItem.cracked = false
          dmItem.loading = false
        }
        throw e
      } finally {
        chunkUids.length = 0
        chunkList.length = 0
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

const crackUser = async (item: DMItem) => {
  try {
    item.loading = true
    const uids = crackUidHash(item.midHash)
    item.uids.splice(0, item.uids.length, ...uids)
    const users = (await publicClient.user.getUserCards(uids)).filter((u) => u != null && u.level > 1) as UserCard[]
    await sleepRandom(1111, 2222)
    item.users.splice(0, item.users.length, ...users)
    item.cracked = true
  } finally {
    item.loading = false
    setTimeout(() => {}, 2000)
  }
}
const formatUserLabel = (user: UserCard) => {
  return `${user.name}　${user.mid}　lv${user.level}`
}
const handleOpenSpace = (user: UserCard) => {
  assertLoggedIn()
  window.open(`https://space.bilibili.com/${user.mid}`)
}
</script>

<template>
  <PluginPageContent class="dm-file-view" v-loading="loading">
    <input ref="fileInputRef" type="file" accept=".xml,text/xml" style="display: none" @change="handleFileChange" />
    <div class="header">
      <div class="actions">
        <el-button @click="triggerUpload" type="primary" size="small">加载弹幕 xml 文件</el-button>
        <el-button v-if="dmMeta" type="primary" @click="handleCrackAll" size="small">{{
          crackingAll ? '取消解析' : '解析当前所有发送者'
        }}</el-button>
        <el-button v-if="dmMeta" @click="saveFile" type="primary" size="small">保存解析结果</el-button>
      </div>
    </div>
    <div v-if="dmList && dmList.length > 0" :key="dmListKey" class="table-wrapper">
      <div class="title">
        <KeyValueTag label="bvid" :value="dmMeta!.bvid"></KeyValueTag>
        <KeyValueTag label="标题" :value="dmMeta!.title"></KeyValueTag>
        <KeyValueTag label="分P" :value="`${dmMeta!.page}P`"></KeyValueTag>
        <KeyValueTag label="cid" :value="dmMeta!.cid"></KeyValueTag>
        <KeyValueTag label="分P标题" :value="dmMeta!.part"></KeyValueTag>
        <KeyValueTag label="弹幕" :value="dmList.length"></KeyValueTag>
      </div>
      <div class="table-query">
        <el-input v-model.trim="queryParams.keyword" placeholder="" clearable size="small">
          <template #prepend>关键词</template>
        </el-input>
        <el-input v-model.trim="queryParams.midHash" placeholder="" clearable size="small">
          <template #prepend>用户Hash</template>
        </el-input>
        <el-input v-model.number="queryParams.uid" type="number" placeholder="" clearable size="small">
          <template #prepend>用户uid</template>
        </el-input>
        <QueryFormItem prefix="弹幕类型" :small="true">
          <el-select v-model.number="queryParams.mode" clearable size="small">
            <el-option v-for="(value, key) in modeMap" :key="key" :label="value" :value="key" />
          </el-select>
        </QueryFormItem>
        <QueryFormItem prefix="弹幕池" :small="true">
          <el-select v-model.number="queryParams.pool" clearable size="small">
            <el-option v-for="(value, key) in poolMap" :key="key" :label="value" :value="key" />
          </el-select>
        </QueryFormItem>
        <el-button type="primary" @click="searchTableData" size="small">查询</el-button>
      </div>
      <div class="table-header">
        <div class="col index">序号</div>
        <div class="col">弹幕 id</div>
        <div class="col">视频时间</div>
        <div class="col content">弹幕内容</div>
        <div class="col">用户hash</div>
        <div class="col">发送时间</div>
        <div class="col">字体</div>
        <div class="col">弹幕颜色</div>
        <div class="col">弹幕类型</div>
        <div class="col">弹幕池</div>
        <div class="col">权重</div>
        <div class="col users">发送者</div>
      </div>
      <div class="table-body-wrapper" v-loading="loadingTable">
        <RecycleScroller
          class="table-body"
          :key="dmListKey"
          :items="filteredList"
          :item-size="(t: DMItem) => 28 * ((t.users ?? []).length || 1)"
          key-field="idStr"
          v-slot="{ item, index }: { item: DMItem; index: number }"
        >
          <div class="table-row" :style="{ height: `${((item.users ?? []).length || 1) * 28}px` }">
            <div class="col index">{{ index + 1 }}</div>
            <AppTooltip class="col" :content="item.idStr"></AppTooltip>
            <div class="col">{{ formatDuration(item.progress / 1000) }}</div>
            <AppTooltip class="col content" :content="item.content"></AppTooltip>
            <div class="col">{{ item.midHash }}</div>
            <div class="col">{{ dayjs.unix(Number(item.ctime)).format('YYYY-MM-DD HH:mm:ss') }}</div>
            <div class="col">{{ item.fontsize }}</div>
            <div class="col">{{ formatColor(item.color) }}</div>
            <div class="col">{{ formatMode(item.mode) }}</div>
            <AppTooltip class="col" :content="formatPool(item.pool)"></AppTooltip>
            <div class="col">{{ item.weight }}</div>
            <div class="col users">
              <span v-if="!item.cracked">
                <template v-if="item.loading">解析中</template>
                <el-button v-else link type="primary" size="small" @click="crackUser(item)">解析</el-button>
              </span>
              <div v-else>
                <div class="cell-users">
                  <AppTooltip
                    v-for="user in item.users"
                    :key="user.mid"
                    @click.stop="handleOpenSpace(user)"
                    :content="formatUserLabel(user)"
                    ><span class="user-info">{{ formatUserLabel(user) }}</span></AppTooltip
                  >
                </div>
              </div>
            </div>
          </div>
        </RecycleScroller>
      </div>
    </div>
  </PluginPageContent>
</template>

<style scoped lang="scss">
.dm-file-view {
  padding: 10px;
  .table-wrapper {
    min-width: 1200px;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border-top: 1px solid var(--el-border-color);
    padding-top: 10px;

    .title {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    ::v-deep(.vue-recycle-scroller__item-view) {
      width: calc(100% - 10px);
    }

    .table-header,
    .table-row {
      display: grid;
      grid-template-columns: 44px 170px 74px 4fr 80px 150px 48px 76px 80px 66px 50px minmax(200px, 2fr);
      align-items: stretch;
      width: 100%;
    }

    .table-header {
      width: calc(100% - 18px);
      height: 32px;
      font-weight: bold;
      border-left: 1px solid var(--el-border-color);
      border-top: 1px solid var(--el-border-color);
    }

    .table-body-wrapper {
      flex: 1;
      min-height: 0;
      border-left: 1px solid var(--el-border-color);
      .table-body {
        position: relative;
        height: 100%;
        overflow-y: auto;
      }
    }

    .table-row {
      font-size: 14px;

      &:hover {
        background-color: var(--el-fill-color);
      }
    }

    .col {
      border-bottom: 1px solid var(--el-border-color);
      border-right: 1px solid var(--el-border-color);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .col.content {
      justify-self: stretch;
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
      .user-info {
        color: var(--el-color-primary);
        font-size: 12px;
        cursor: pointer;

        &:hover {
          border-bottom: 1px solid var(--app-color-primary-transparent-70);
        }
      }
    }

    .table-query,
    .table-actions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 20px;
      margin-bottom: 20px;
      ::v-deep(.el-input-group) {
        width: 160px;
        .el-input-group__prepend {
          padding: 0 10px;
        }
      }
    }
  }
}
</style>
