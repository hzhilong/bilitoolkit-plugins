import type { MyArchiveWithSeason, MySeasonItem, MyArchive } from '@/types'
import type { BiliClient } from '@ybgnb/bili-api'
import { sleepRandom, chunk } from '@ybgnb/utils'

const isSameArcOrder = (a: MyArchive[], b: MyArchive[]) =>
  a.length === b.length && a.every((v, i) => v.aid === b[i].aid)

export async function saveSeason(context: {
  oldMyArchives: MyArchiveWithSeason[]
  myArchives: MyArchiveWithSeason[]
  oldMySeasons: MySeasonItem[]
  mySeasons: MySeasonItem[]
  client: BiliClient
  signal: AbortSignal
  logger: (msg: string) => void
}) {
  const { client, logger, mySeasons, myArchives: newArchives, oldMySeasons, oldMyArchives, signal } = context
  const bizOptions = { signal }

  logger('=============【更新合集信息】=============')
  for (const {
    season: newSeason,
    sections: { sections: newSections },
  } of mySeasons) {
    logger('------------------')
    logger(`合集 ${newSeason.id} ${newSeason.title}`)
    const oldSeason = oldMySeasons.find((s) => s.season.id === newSeason.id)
    if (!oldSeason) {
      logger('该合集已新增')
    } else {
      logger('已有的合集，正在更新')
      await client.season.updateSeason(
        {
          season: {
            id: newSeason.id,
            title: newSeason.title,
            cover: newSeason.cover,
            desc: newSeason.desc,
          },
          sorts: newSections.map((s, i) => ({
            id: s.id,
            sort: i + 1,
          })),
        },
        bizOptions,
      )
      await sleepRandom(1122, 2233)
      logger('合集信息更新成功')
    }
  }
  logger('=============【正在更新稿件关联的合集】=============')

  const oldBindSeasonArcs = oldMyArchives.filter((a) => a.seasonId != null && a.sectionId != null)
  const oldBindSeasonArcIds = oldBindSeasonArcs.map((a) => a.aid)
  const newBindSeasonArcs = newArchives.filter((a) => a.seasonId != null && a.sectionId != null)
  const newBindSeasonArcIds = newBindSeasonArcs.map((a) => a.aid)

  const deletedSeasonArcs = oldBindSeasonArcs.filter((oldArc) => {
    if (!newBindSeasonArcIds.includes(oldArc.aid)) return true

    const newArc = newBindSeasonArcs.find((na) => oldArc.aid === na.aid)
    if (!newArc) return true

    return newArc.seasonId !== oldArc.seasonId || newArc.sectionId !== oldArc.sectionId
  })
  //  const deletedSeasonArcIds = deletedSeasonArcs.map((a) => a.aid)
  const addedSeasonArcs = newBindSeasonArcs.filter((oldArc) => {
    if (!oldBindSeasonArcIds.includes(oldArc.aid)) return true

    const newArc = oldBindSeasonArcs.find((na) => oldArc.aid === na.aid)
    if (!newArc) return true

    return newArc.seasonId !== oldArc.seasonId || newArc.sectionId !== oldArc.sectionId
  })
  const addedSeasonArcIds = addedSeasonArcs.map((a) => a.aid)

  if (deletedSeasonArcs.length > 0) {
    logger('------------------')
    logger(`有${deletedSeasonArcs.length}个旧的合集稿件被移除，正在处理`)
    for (const deletedSeasonArc of deletedSeasonArcs) {
      if (deletedSeasonArc.episodeId != null) {
        await client.season.deleteVideo(deletedSeasonArc.episodeId, bizOptions)
        await sleepRandom(1122, 2233)
        logger(`成功移除 ${deletedSeasonArc.bvid} ${deletedSeasonArc.title}`)
      }
    }
  }

  logger('------------------')
  logger('正在处理新增的分组视频')
  for (const {
    season: newSeason,
    sections: { sections: newSections },
  } of mySeasons) {
    logger('------------------')
    logger(`合集 ${newSeason.id} ${newSeason.title}`)

    for (const newSection of newSections) {
      logger(`分组 ${newSection.id} ${newSection.title}`)
      if (newSection.archives.length === 0) {
        logger('分组视频为空')
      } else {
        const secAddedArcs = newSection.archives.filter((arc) => addedSeasonArcIds.includes(arc.aid))
        if (secAddedArcs.length === 0) {
          logger('分组视频未新增')
          const oldSection = oldMySeasons.flatMap((s) => s.sections.sections).find((sc) => sc.id === newSection.id)
          if (
            oldSection &&
            (!isSameArcOrder(oldSection.archives, newSection.archives) || newSection.title !== oldSection.title)
          ) {
            logger('正在更新分组信息')
            await client.season.updateSection(
              {
                section: {
                  id: newSection.id,
                  title: newSection.title,
                  seasonId: newSection.seasonId,
                  type: newSeason.no_section as 0 | 1,
                },
                sorts: newSection.archives.map((arc, i) => ({
                  id: arc.episodeId!,
                  sort: i + 1,
                })),
              },
              bizOptions,
            )
            await sleepRandom(1122, 2233)
          }
        } else {
          logger('有新增的分组视频')
          for (const chunkArcs of chunk(secAddedArcs, 50)) {
            await client.season.addVideo(
              {
                sectionId: newSection.id,
                episodes: chunkArcs.map((arc) => ({
                  aid: arc.aid,
                  cid: arc.firstCid,
                  title: arc.title,
                })),
              },
              bizOptions,
            )
            await sleepRandom(1122, 2233)
            logger(`成功新增${chunkArcs.length}个视频到该合集分组内`)
          }
          logger(`正在获取新增的视频信息`)
          await sleepRandom(1122, 2233)
          const { episodes } = await client.season.getVideos(newSection.id, bizOptions)
          await sleepRandom(1122, 2233)
          const newEpIds = new Map<number, number>(episodes.map((ep) => [ep.aid, ep.id]))
          logger('正在更新分组信息')
          await client.season.updateSection(
            {
              section: {
                id: newSection.id,
                title: newSection.title,
                seasonId: newSection.seasonId,
                type: newSeason.no_section as 0 | 1,
              },
              sorts: newSection.archives
                .map((arc, i) => ({
                  id: newEpIds.has(arc.aid) ? newEpIds.get(arc.aid)! : -1,
                  sort: i + 1,
                }))
                .filter((arc) => arc.id !== -1),
            },
            bizOptions,
          )
          await sleepRandom(1122, 2233)
        }
      }
    }
  }

  logger('==========================')
  logger('操作完成，所有操作已同步到哔哩哔哩')
}
