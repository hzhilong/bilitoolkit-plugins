import { ToViewModule } from '@/core/modules/toview'
import type { DataModule } from '@/core/types/data-module'
import type { DataType } from '@/core/types/data-type'
import { FollowingModule } from '@/core/modules/following'

/**
 * 注册的模块
 */
export const registeredModules: DataModule[] = [new FollowingModule(), new ToViewModule()]

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
