import { type DataType, DataTypeMap } from '@/core/types/data-type'
import { BackupRestoreModule } from '@/core/modules/backup-restore-module'
import { type PrivacySettings, type PageDataWithNextParams, type ExactlyOne, PrivacySettingsMap } from '@ybgnb/bili-api'
import type { BackupDataRangeType, ExportTarget } from '@/core/types/backup'
import type { ExecuteContext } from '@/core/types/execute'
import { toSinglePageData } from '@/core/utils/data-range'
import { invokeBiliApi, biliApi } from 'bilitoolkit-runtime/biliapi'
import { apiSleep } from '@/core/utils/sleep'

export class SpacePrivacyModule extends BackupRestoreModule<PrivacySettings> {
  dataType: DataType = 'space_privacy'
  dataTypeName: string = DataTypeMap[this.dataType].name
  backupDataRangeTypes: BackupDataRangeType[] = ['all']
  exportTargets: ExportTarget[] = ['json']

  getDataTitle(): string {
    return '隐私设置'
  }

  getDataTotalDesc(): string {
    return '隐私设置'
  }

  getPageSize(): number {
    return 1
  }

  async fetchPage({ clientId, signal }: ExecuteContext): Promise<PageDataWithNextParams<PrivacySettings>> {
    return toSinglePageData((await invokeBiliApi(clientId, biliApi.spaceSettings.getSpaceSettings, { signal })).privacy)
  }

  async restoreData(
    { clientId, signal, onProgress }: ExecuteContext,
    settings: PrivacySettings,
  ): Promise<string | void> {
    onProgress?.(0, `正在获取最新的隐私设置`)
    const currSettings = (await invokeBiliApi(clientId, biliApi.spaceSettings.getSpaceSettings, { signal })).privacy
    await apiSleep(signal)
    const fields = Object.keys(settings) as (keyof PrivacySettings)[]
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i]
      const value = settings[field as keyof typeof settings]

      if (currSettings[field] === value) {
        onProgress?.((i * 100) / fields.length, `隐私项未更改 [${PrivacySettingsMap[field]}]`)
        continue
      }

      onProgress?.((i * 100) / fields.length, `正在设置隐私项 [${PrivacySettingsMap[field]}]`)
      try {
        await invokeBiliApi(
          clientId,
          biliApi.spaceSettings.updatePrivacy,
          {
            [field]: value,
          } as unknown as ExactlyOne<PrivacySettings>,
          { signal },
        )
      } catch {}
      await apiSleep(signal)
    }
  }
}
