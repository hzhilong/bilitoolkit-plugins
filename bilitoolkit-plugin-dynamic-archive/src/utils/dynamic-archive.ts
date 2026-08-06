import type { ArchiveTaskContext, ArchiveTaskResult } from '../types/index.js'
import { lastQueryTimeRepo } from '../db/last-query-time.js'
import { formatTime, sleepRandom, getErrorMessage, inArray } from '@ybgnb/utils'
import { type Dynamic } from '@ybgnb/bili-api'

export const handleDynamicArchive = async (context: ArchiveTaskContext): Promise<ArchiveTaskResult | null> => {
  const nowDate = new Date()
  const { logger, logPrefix, biliClient, signal, targetUid, taskConfigCreatedAt } = context

  const lastTime = (await lastQueryTimeRepo.get(targetUid)) ?? taskConfigCreatedAt

  try {
    if (lastTime == null) {
      logger.info(`${logPrefix} 首次执行，初始化完成。后续会自动保存 ${formatTime(nowDate)} 以后的图文动态`)
      return null
    }

    logger.info(`${logPrefix} 正在获取最新的图文动态`)
    const pager = biliClient.spaceDynamic.buildPager({ host_mid: targetUid }, undefined, { signal })
    const dynamics: Dynamic[] = []
    while (true) {
      const pageList = await pager.fetchNext()
      if (!pageList || pageList.length < 1) {
        break
      }
      let isEnd = false
      for (const item of pageList) {
        if (!inArray(item.type, ['DYNAMIC_TYPE_DRAW', 'DYNAMIC_TYPE_WORD'])) continue

        const opus = item.modules.module_dynamic.major?.opus

        if (!opus) continue

        if (lastTime < Number(item.modules.module_author.pub_ts)) {
          dynamics.push(item)
        } else {
          isEnd = true
        }
      }
      await sleepRandom(1422, 2333)
      if (isEnd) {
        break
      }
    }

    logger.info(`${logPrefix} 已获取 ${dynamics.length} 个图文动态`)

    return {
      dynamics: dynamics,
    }
  } catch (e) {
    logger.error(`${logPrefix} ${getErrorMessage(e)}`)
    return null
  } finally {
    await lastQueryTimeRepo.set(targetUid, Math.floor(nowDate.getTime() / 1000))
  }
}
