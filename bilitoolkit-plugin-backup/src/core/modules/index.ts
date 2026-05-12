import { ToView } from '@/core/modules/toview'
import type { DataModule } from '@/core/types/data-module'

/**
 * 所有的模块
 */
export const DATA_MODULES: DataModule[] = [new ToView()]

/**
 * 所有的模块映射
 */
export const DATA_MODULES_MAP = Object.fromEntries(DATA_MODULES.map((module: DataModule) => [module.dataType, module]))
