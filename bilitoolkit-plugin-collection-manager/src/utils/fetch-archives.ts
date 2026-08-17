import type { MyArchive, FetchDataContext, MyArchiveWithSeason } from '@/types'
import type { MyArcAuditItem } from '@ybgnb/bili-api'
import { cacheStateRepo } from '@/db/repo/cache-state'
import { sleepRandom } from '@ybgnb/utils'
import { fetchMySeasonItems } from '@/utils/fetch-season'
import { myArchivesRepo } from '@/db/repo/my-archives'

export async function fetchMyPubedArchives(context: FetchDataContext): Promise<MyArchive[]> {
  const { client, logger, useCache, signal, currUid } = context
  const now = Math.floor(Date.now() / 1000)
  const cacheState = await cacheStateRepo.findByUid(currUid)
  logger(`正在获取所有已审核通过的投稿[${useCache ? '已启用' : '未启用'}缓存]`)
  const videos: MyArcAuditItem[] = []
  await client.myArchive.fetchAll(
    {
      status: 'pubed',
    },
    undefined,
    async (currList) => {
      for (const item of currList) {
        if (useCache && cacheState != null && item.Archive.ptime <= cacheState.lastTime) {
          return false
        }
        videos.push(item)
      }
    },
    { signal },
  )
  const myArchives = videos.map(({ Archive, cid_list }) => {
    return {
      aid: Archive.aid,
      uid: currUid,
      bvid: Archive.bvid,
      firstCid: cid_list[0],
      pubTime: Archive.ptime,
      title: Archive.title,
    } as MyArchive
  })
  if (useCache) {
    if (videos.length > 0) {
      await myArchivesRepo.bulkPut(myArchives)
    }
    await cacheStateRepo.put({
      uid: currUid,
      lastTime: videos.length > 0 ? videos[0].Archive.ptime : now,
    })

    return await myArchivesRepo.findByUid(currUid)
  }
  return myArchives
}

export async function fetchMyArchives(context: FetchDataContext) {
  const { logger, signal } = context
  const mySeasonItems = await fetchMySeasonItems(context)
  await sleepRandom(1122, 2777, signal)
  logger(`正在处理合集数据`)
  // aid<> [seasonId,sectionId]
  const videoMapSeason = new Map<number, [number, number, number]>()
  for (const { season, sections } of mySeasonItems) {
    for (const section of sections.sections) {
      for (const archive of section.archives) {
        videoMapSeason.set(archive.aid, [season.id, section.id, archive.episodeId!])
      }
    }
  }
  const myArchives = await fetchMyPubedArchives(context)
  logger(`正在处理合集数据`)
  const myArchivesWithSeason = myArchives.map((myArchive) => {
    const seasonData = videoMapSeason.get(myArchive.aid)
    return {
      ...myArchive,
      seasonId: seasonData?.[0],
      sectionId: seasonData?.[1],
      episodeId: seasonData?.[2],
    } as MyArchiveWithSeason
  })
  for (const { sections } of mySeasonItems) {
    for (const section of sections.sections) {
      for (const archive of section.archives) {
        if (archive.pubTime === 0) {
          const pubedArc = myArchives.find((a) => a.aid === archive.aid)
          archive.pubTime = pubedArc?.pubTime ?? 0
        }
      }
    }
  }
  return {
    mySeasonItems: mySeasonItems,
    myArchives: myArchivesWithSeason,
  }
}
