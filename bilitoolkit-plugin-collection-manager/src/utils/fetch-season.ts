import type { FetchDataContext, MySeasonSection, MySeasonItem } from '@/types'
import { sleepRandom } from '@ybgnb/utils'

export async function fetchMySeasonItems(context: FetchDataContext): Promise<MySeasonItem[]> {
  const { client, signal, logger, currUid } = context
  logger(`正在获取所有合集`)
  const seasons = await client.season.fetchAll(
    {
      order: 'mtime',
      sort: 'desc',
    },
    undefined,
    undefined,
    { signal },
  )
  const mySeasonItems: MySeasonItem[] = []
  for (const { season, seasonStat, checkin, part_episodes, sections } of seasons) {
    const mySections: MySeasonSection[] = []
    for (const section of sections.sections) {
      if (section.epCount > 0) {
        await sleepRandom(1333, 2345, signal)
        const { section: newSection, episodes } = await client.season.getVideos(section.id, { signal })
        mySections.push({
          ...section,
          ...newSection,
          archives: (episodes ?? []).map((p) => {
            return {
              uid: currUid,
              aid: p.aid,
              bvid: p.bvid,
              firstCid: p.cid,
              title: p.title,
              pubTime: 0,
              seasonId: season.id,
              sectionId: newSection.id,
              episodeId: p.id,
            }
          }),
        })
      } else {
        mySections.push({
          ...section,
          archives: [],
        })
      }
    }
    mySeasonItems.push({
      season: season,
      checkin: checkin,
      seasonStat: seasonStat,
      sections: {
        sections: mySections,
      },
      part_episodes: part_episodes,
    })
  }
  return mySeasonItems
}
