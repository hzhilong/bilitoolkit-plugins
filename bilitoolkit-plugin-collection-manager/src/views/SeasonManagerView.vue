<script setup lang="ts">
import { PluginPageContent, useSelectedUserStore, loadingDialog, showError, showConfirm } from 'bilitoolkit-ui'
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { BiliClient, type SeasonSectionID, type SeasonItem, type SeasonID } from '@ybgnb/bili-api'
import { fetchMyArchives } from '@/utils/fetch-archives'
import { useAppSettingsStore } from '@/stores/app-settings'
import type { MyArchiveWithSeason, MySeasonItem, UpdateSeason, AddSeason, MyArchive, MySeasonSection } from '@/types'
import { cloneDeep } from 'lodash-es'
import { getErrorMessage, sleep } from '@ybgnb/utils'
import EditSeasonModal from '@/components/EditSeasonModal.vue'
import AddSectionModal from '@/components/AddSectionModal.vue'
import EditSectionModal from '@/components/EditSectionModal.vue'
import type { SaveDataModalProps } from '@/components/types'

const userStore = useSelectedUserStore()
const { assertLoggedIn } = userStore
const { user } = storeToRefs(userStore)
const { appSettings } = storeToRefs(useAppSettingsStore())
const isLoadedData = ref(false)
const currUid = ref<number>()
const client = ref<BiliClient>()

let oldMyArchives: MyArchiveWithSeason[] = []
let oldMySeasons: MySeasonItem[] = []
const myArchives = ref<MyArchiveWithSeason[]>([])
const mySeasons = ref<MySeasonItem[]>([])

const updateMyArchives = (
  aids: number[],
  seasonID: SeasonID | undefined = undefined,
  sectionId: SeasonSectionID | undefined = undefined,
) => {
  if (aids.length === 0) return
  for (const item of myArchives.value) {
    if (aids.includes(item.aid)) {
      item.seasonId = seasonID
      item.sectionId = sectionId
    }
  }
}

const isInit = computed(() => isLoadedData.value && currUid.value != null && currUid.value === user.value?.mid)
const handleInit = async () => {
  try {
    assertLoggedIn()
    const currUser = user.value!
    const abortController = new AbortController()
    const signal = abortController.signal
    const onCancel = () => abortController.abort()
    const showLoading = (msg: string) => {
      loadingDialog.show({
        message: msg,
        showCancel: true,
        onCancel,
      })
    }
    client.value = new BiliClient({
      context: {
        userCookie: currUser.userCookie,
      },
    })
    const result = await fetchMyArchives({
      currUid: currUser.mid,
      logger: showLoading,
      signal: signal,
      client: client.value,
      useCache: appSettings.value.cacheMyArchives,
    })
    showLoading('处理数据中')
    oldMySeasons = result.mySeasonItems
    oldMyArchives = result.myArchives
    mySeasons.value = cloneDeep(result.mySeasonItems)
    myArchives.value = cloneDeep(result.myArchives)
    currUid.value = currUser.mid
    isLoadedData.value = true
  } catch (e) {
    showError(getErrorMessage(e))
    client.value = undefined
    currUid.value = undefined
    isLoadedData.value = false
  } finally {
    loadingDialog.close()
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const execTask = <TArgs extends any[] = [], TReturn = void>(task: (...args: TArgs) => Promise<TReturn>) => {
  return async (...args: TArgs): Promise<TReturn> => {
    try {
      loadingDialog.show({
        message: '加载中，请稍候',
      })
      return await task(...args)
    } finally {
      loadingDialog.close()
    }
  }
}

const seasonEditModalMode = ref<'edit' | 'add'>('edit')
const seasonEditModalData = ref<MySeasonItem>()
const seasonEditModalVisible = ref(false)

const handleAddSeason = async () => {
  seasonEditModalMode.value = 'add'
  seasonEditModalData.value = undefined
  seasonEditModalVisible.value = true
}

const handleEditSeason = async (season: MySeasonItem) => {
  seasonEditModalMode.value = 'edit'
  seasonEditModalData.value = season
  seasonEditModalVisible.value = true
}

const handleUpdatedSeason = async (updateSeason: UpdateSeason, sections: MySeasonSection[]) => {
  if (seasonEditModalData.value!.season.no_section !== updateSeason.no_section) {
    await client.value?.season.switchSection({
      season_id: seasonEditModalData.value!.season.id,
      no_section: updateSeason.no_section as 0 | 1,
    })
  }
  Object.assign(seasonEditModalData.value!.season, updateSeason)
  seasonEditModalData.value!.sections.sections = sections
}
const handleAddedSeason = execTask(async (addSeason: AddSeason) => {
  const id = await client.value!.season.createSeason(addSeason)
  await sleep(500)
  const { season, sections } = await client.value!.season.getSeasonWithSections(id)
  mySeasons.value.unshift({
    season: season,
    sections: {
      sections: sections.sections.map((s) => {
        return {
          ...s,
          archives: [],
        }
      }),
    },
    checkin: { status: 0, status_reason: '', season_status: 0 },
    seasonStat: {
      view: 0,
      danmaku: 0,
      reply: 0,
      fav: 0,
      coin: 0,
      share: 0,
      nowRank: 0,
      hisRank: 0,
      like: 0,
      subscription: 0,
      vt: 0,
    },
    part_episodes: null,
  })
})

const sectionAddModalVisible = ref(false)
const sectionAddModalSeasonId = ref<number>()
const handleAddSection = async (season: MySeasonItem) => {
  sectionAddModalSeasonId.value = season.season.id
  sectionAddModalVisible.value = true
}
const handleAddedSection = execTask(async (title: string) => {
  const seasonId = sectionAddModalSeasonId.value!
  const sid = await client.value!.season.createSection({
    seasonId: seasonId,
    title: title,
  })
  await sleep(300)
  const { section } = await client.value!.season.getVideos(sid)
  const season = mySeasons.value.find((s) => s.season.id === seasonId)
  if (season) {
    season.sections.sections.push({
      ...section,
      archives: [],
    })
  }
})

const sectionEditModalVisible = ref(false)
const sectionEditModalArchives = ref<MyArchive[]>([])
const sectionEditModalData = ref<MySeasonSection>()
const sectionEditModalSeason = ref<MySeasonItem>()

const handleEditSection = async (season: MySeasonItem, sectionId: SeasonSectionID) => {
  const section = season.sections.sections.find((s) => s.id === sectionId)
  if (!section) {
    return showError('内部错误，该小节不存在')
  }
  sectionEditModalArchives.value = myArchives.value.filter((a) => a.seasonId == null && a.sectionId == null)
  sectionEditModalSeason.value = season
  sectionEditModalData.value = section
  sectionEditModalVisible.value = true
}

const handleEditedSection = execTask(async (title: string, newArchives: MyArchive[]) => {
  const oldSection = sectionEditModalData.value
  if (oldSection) {
    for (const season of mySeasons.value) {
      if (season.season.id === oldSection.seasonId) {
        for (const section of season.sections.sections) {
          if (section.id === oldSection.id) {
            season.season.ep_num = season.season.ep_num + (newArchives.length - section.archives.length)
            const newArcIds = newArchives.map((a) => a.aid)
            const oldArcIds = section.archives.map((a) => a.aid)
            const addArcIds = newArchives.filter((a) => !oldArcIds.includes(a.aid)).map((a) => a.aid)
            const deleteArcIds = section.archives.filter((a) => !newArcIds.includes(a.aid)).map((a) => a.aid)
            section.archives = newArchives
            section.title = title
            section.epCount = newArchives.length
            updateMyArchives(addArcIds, season.season.id, section.id)
            updateMyArchives(deleteArcIds)
            return
          }
        }
        return
      }
    }
  }
})

const handleDeleteSeason = async (season: MySeasonItem, index: number) => {
  await showConfirm(`确认删除合集[${season.season.title}]吗？（此操作将立即生效）`)
  await showConfirm(`确认删除合集[${season.season.title}]吗？（最后一次提醒）`)
  await execTask(async () => {
    await client.value!.season.deleteSeason(season.season.id)
    mySeasons.value.splice(index, 1)
    for (const section of season.sections.sections) {
      updateMyArchives(section.archives.map((p) => p.aid))
    }
  })()
}
const handleDeleteSection = async (season: MySeasonItem, sectionId: SeasonSectionID) => {
  await showConfirm(`确认删除小节吗？（此操作将立即生效）`)
  await showConfirm(`确认删除小节吗？（最后一次提醒）`)
  await execTask(async () => {
    await client.value!.season.deleteSection(sectionId)
    const sectionIndex = season.sections.sections.findIndex((s) => s.id === sectionId)
    if (sectionIndex > -1) {
      const section = season.sections.sections[sectionIndex]
      updateMyArchives(section.archives.map((p) => p.aid))
      season.sections.sections.splice(sectionIndex, 1)
    }
  })()
}

const saveDataModalVisible = ref(false)
const saveDataModalData = ref<SaveDataModalProps>({
  oldMyArchives: [],
  myArchives: [],
  oldMySeasons: [],
  mySeasons: [],
  client: undefined,
})
const handleSaveAll = async () => {
  saveDataModalData.value = {
    oldMyArchives,
    oldMySeasons,
    mySeasons: mySeasons.value,
    myArchives: myArchives.value,
    client: client.value!,
  }
  saveDataModalVisible.value = true
}
const handleDataSaved = async () => {
  isLoadedData.value = false
}
</script>

<template>
  <PluginPageContent class="page-content">
    <div class="header">
      <el-button type="primary" @click="handleInit">获取合集和投稿数据</el-button>
      <template v-if="isInit">
        <el-button type="primary" @click="handleAddSeason">添加合集</el-button>
        <el-button type="primary" @click="handleSaveAll">保存全部更改</el-button>
      </template>
    </div>
    <el-alert v-if="isInit" description="修改后请及时保存，部分稿件操作将在保存时同步更新" />
    <div class="season-list">
      <template v-if="isInit">
        <SeasonItem
          v-for="(season, index) in mySeasons"
          :key="season.season.id"
          :season="season"
          @editSeason="handleEditSeason(season)"
          @deleteSeason="handleDeleteSeason(season, index)"
          @addSection="handleAddSection(season)"
          @editSection="(sectionId: SeasonSectionID) => handleEditSection(season, sectionId)"
          @deleteSection="(sectionId: SeasonSectionID) => handleDeleteSection(season, sectionId)"
        ></SeasonItem>
      </template>
    </div>
    <EditSeasonModal
      :season="seasonEditModalData"
      :mode="seasonEditModalMode"
      :client="client"
      v-model="seasonEditModalVisible"
      @update="handleUpdatedSeason"
      @add="handleAddedSeason"
    ></EditSeasonModal>
    <AddSectionModal v-model="sectionAddModalVisible" @add="handleAddedSection"></AddSectionModal>
    <EditSectionModal
      :section="sectionEditModalData"
      :season="sectionEditModalSeason"
      :client="client"
      :my-archives="sectionEditModalArchives"
      v-model="sectionEditModalVisible"
      @edit="handleEditedSection"
    ></EditSectionModal>
    <SaveDataModal
      :oldMyArchives="saveDataModalData.oldMyArchives"
      :myArchives="saveDataModalData.myArchives"
      :oldMySeasons="saveDataModalData.oldMySeasons"
      :mySeasons="saveDataModalData.mySeasons"
      :client="saveDataModalData.client as BiliClient"
      v-model="saveDataModalVisible"
      @saved="handleDataSaved"
    ></SaveDataModal>
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

  .header {
    width: 100%;
    display: flex;
    justify-content: flex-start;
  }

  .season-list {
    width: 100%;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding-right: 8px;
    overflow-y: auto;
    gap: 12px;
  }
}
</style>
