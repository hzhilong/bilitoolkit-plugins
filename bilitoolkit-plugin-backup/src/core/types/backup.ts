import type { DataRange, DataRangeType } from '@/core/types/data-range'
import type { BatchProgress } from '@/core/types/batch'
import type { BaseExecuteOptions } from '@/core/types/execute'

/**
 * 备份目标的类型
 */
export type ExportTarget = 'json' | 'video' | 'audio' | 'other'

/**
 * 目标的扩展名
 */
export const TargetExtension: Record<ExportTarget, string> = {
  json: '.txt',
  video: '.mp4',
  audio: '.mp3',
  other: '',
}

/**
 * 备份数据范围的类型
 */
export type BackupDataRangeType = Extract<DataRangeType, 'all' | 'page' | 'tree'>

/**
 * 基础备份选项
 */
export interface BaseBackupOptions {
  /** 文件根目录路径 */
  rootPath: string
  /** 选择的导出目标 */
  exportTargets: ExportTarget[]
}

/**
 * 分批处理模式的备份选项
 */
export type BackupBatchOptions = BaseBackupOptions & BaseExecuteOptions<'backup', 'batch'>

/**
 * 普通模式的备份选项
 */
export type BackupNormalOptions = BaseBackupOptions &
  BaseExecuteOptions<'backup', 'normal'> & {
    /** 数据范围 */
    dataRange: DataRange<BackupDataRangeType>
  }

/**
 * 备份选项
 */
export type BackupOptions = BackupBatchOptions | BackupNormalOptions

/**
 * 备份的资源
 */
export interface BackupAsset<T extends ExportTarget = ExportTarget> {
  /** 导出目标类型 */
  type: T
  /** 资源名称 */
  name: string
  /** 文件名称 */
  fileName: string
  /** 文件相对路径 */
  filePath: string
}

/**
 * 备份结果
 */
export type BackupResult = {
  /** 已备份的资源 */
  backupAssets?: BackupAsset[]
  /** 分批处理的进度 */
  batchProgress?: BatchProgress
}
