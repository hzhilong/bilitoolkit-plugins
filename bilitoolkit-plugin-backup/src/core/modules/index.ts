import type { BaseModule } from '@/core/modules/base-module'
import { ToView } from '@/core/modules/toview'

/**
 * 所有的模块
 */
export const DATA_MODULES: BaseModule[] = [new ToView()]

/**
 * 所有的模块映射
 */
export const DATA_MODULES_MAP = Object.fromEntries(DATA_MODULES.map((module: BaseModule) => [module.dataType, module]))
