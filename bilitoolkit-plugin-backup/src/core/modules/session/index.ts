import { type DataType, DataTypeMap } from '@/core/types/data-type'
import type { ExecuteContext } from '@/core/types/execute'
import { OnlyClearableModule } from '@/core/modules/only-clearable-module'
import { apiSleep } from '@/core/utils/sleep'
import type { Session } from '@ybgnb/bili-api'

export class SessionModule extends OnlyClearableModule {
  dataType: DataType = 'session'
  dataTypeName: string = DataTypeMap[this.dataType].name

  async clearData(context: ExecuteContext): Promise<string | void> {
    const { client, signal, onProgress } = context
    const getSessions = (type: number) => {
      return client.session.fetchAll({ session_type: type }, undefined, undefined, { signal })
    }
    const delSessions = async (typeName: string, list: Session[]) => {
      if (!list || list.length === 0) {
        onProgress?.(100, `[${typeName}]私信为空`)
        return
      }
      let delCount = 0
      for (let i = 0; i < list.length; i++) {
        const { talker_id, session_type, last_msg, account_info } = list[i]
        const progress = ((i + 1) * 100) / list.length

        await client.session.delSession({ talker_id, session_type }, { signal })
        delCount++
        onProgress?.(progress, `成功删除[${typeName}]私信 [${account_info?.name ?? last_msg?.sender_uid}]`)
        await apiSleep(signal)
      }

      onProgress?.(100, `成功删除 ${delCount} 条[${typeName}]私信`)
    }

    const handleSessions = async (typeName: string, typeCode: number) => {
      onProgress?.(0, `正在获取[${typeName}]私信`)
      const sessionList = await getSessions(typeCode)
      onProgress?.(0, `已获取 ${sessionList.length} 条[${typeName}]私信`)
      await apiSleep(signal)
      await delSessions(typeName, sessionList)
    }

    await handleSessions('用户与系统', 1)
    await handleSessions('粉丝团', 3)
    await handleSessions('被拦截', 5)
  }
}
