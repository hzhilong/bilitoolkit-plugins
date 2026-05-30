import { DataModule } from '@/core/modules/data-module'
import { ToViewModule } from '@/core/modules/toview'
import type { DataType } from '@/core/types/data-type'
import { FollowingModule } from '@/core/modules/following'
import { FollowedAnimeModule } from '@/core/modules/bangumi/anime'
import { FollowedTvModule } from '@/core/modules/bangumi/tv'
import { FansModule } from '@/core/modules/fans'
import { BlackModule } from '@/core/modules/black'
import { HistoryModule } from '@/core/modules/history'

/**
 * 注册的模块
 */
export const registeredModules: DataModule[] = [
  new FollowingModule(),
  new FansModule(),
  new BlackModule(),
  new ToViewModule(),
  new FollowedAnimeModule(),
  new FollowedTvModule(),
  new HistoryModule(),
]

/**
 * 注册的模块映射
 */
export const registeredModulesMap = Object.fromEntries(
  registeredModules.map((module: DataModule) => [module.dataType, module]),
)

/**
 * 注册的模块类型
 */
export const registeredModuleTypes: DataType[] = registeredModules.map((m) => m.dataType)

export const allBackupableModules = registeredModules.filter((m) => m.operations.includes('backup'))
export const allRestorableModules = registeredModules.filter((m) => m.operations.includes('restore'))
export const allClearableModules = registeredModules.filter((m) => m.operations.includes('clear'))
